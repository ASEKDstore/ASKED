import { prisma } from './setup';
import {
  createProduct,
  postPurchase,
  getStockFromMovements,
  getStockFromLots,
  getLots,
  getAllocationsForOrderItem,
} from './helpers/warehouse-test-helpers';
import { OrdersService } from '../src/orders/orders.service';
import { WarehouseService } from '../src/warehouse/warehouse.service';
import { PrismaService } from '../src/prisma/prisma.service';
import { NotificationsService } from '../src/notifications/notifications.service';
import { TelegramBotService } from '../src/orders/telegram-bot.service';

// Mock services that are not needed for FIFO tests
const mockNotificationsService = {} as NotificationsService;
const mockTelegramBotService = {} as TelegramBotService;

describe('FIFO Warehouse Accounting', () => {
  let ordersService: OrdersService;
  let warehouseService: WarehouseService;
  let prismaService: PrismaService;

  beforeEach(async () => {
    prismaService = new PrismaService();
    ordersService = new OrdersService(prismaService, mockTelegramBotService, mockNotificationsService);
    warehouseService = new WarehouseService(prismaService);
  });

  afterEach(async () => {
    await prismaService.$disconnect();
  });

  describe('Test 1: FIFO allocation across multiple lots', () => {
    it('should allocate qty 12 from two lots: 10@500 + 2@700', async () => {
      // Create product
      const product = await createProduct({
        title: 'Test Product',
        price: 1500,
        costPrice: 600,
      });

      // Post purchase1: qty 10 @ cost 500
      const purchase1 = await postPurchase({
        items: [{ productId: product.id, qty: 10, unitCost: 500 }],
      });

      // Post purchase2: qty 10 @ cost 700
      const purchase2 = await postPurchase({
        items: [{ productId: product.id, qty: 10, unitCost: 700 }],
      });

      // Create order for qty 12
      const order = await ordersService.create(null, {
        items: [{ productId: product.id, qty: 12 }],
        customerName: 'Test Customer',
        customerPhone: '+79991234567',
        channel: 'AS',
      });

      // Verify allocations
      const orderItem = order.items[0];
      expect(orderItem).toBeDefined();
      expect(orderItem.qty).toBe(12);

      const allocations = await getAllocationsForOrderItem(orderItem.id);
      expect(allocations.length).toBe(2);

      // First allocation: 10 @ 500
      const allocation1 = allocations.find((a) => a.unitCost === 500);
      expect(allocation1).toBeDefined();
      expect(allocation1?.qty).toBe(10);

      // Second allocation: 2 @ 700
      const allocation2 = allocations.find((a) => a.unitCost === 700);
      expect(allocation2).toBeDefined();
      expect(allocation2?.qty).toBe(2);

      // Verify COGS: 10*500 + 2*700 = 5000 + 1400 = 6400
      expect(orderItem.cogsTotal).toBe(6400);

      // Verify lot remaining quantities
      const lots = await getLots(product.id);
      const lot1 = lots.find((l) => l.unitCost === 500);
      const lot2 = lots.find((l) => l.unitCost === 700);

      expect(lot1?.qtyRemaining).toBe(0);
      expect(lot2?.qtyRemaining).toBe(8);

      // Verify no negative remaining
      lots.forEach((lot) => {
        expect(lot.qtyRemaining).toBeGreaterThanOrEqual(0);
      });
    });
  });

  describe('Test 2: Not enough stock rejects and does NOT mutate lots', () => {
    it('should throw error and not mutate lots when order qty exceeds stock', async () => {
      const product = await createProduct({ title: 'Test Product', price: 1000 });

      // Post purchase: qty 5 @ cost 500
      const purchase = await postPurchase({
        items: [{ productId: product.id, qty: 5, unitCost: 500 }],
      });

      const lotsBefore = await getLots(product.id);
      expect(lotsBefore.length).toBe(1);
      expect(lotsBefore[0].qtyRemaining).toBe(5);

      // Attempt order qty 6
      await expect(
        ordersService.create(null, {
          items: [{ productId: product.id, qty: 6 }],
          customerName: 'Test',
          customerPhone: '+79991234567',
        }),
      ).rejects.toThrow();

      // Verify lots unchanged
      const lotsAfter = await getLots(product.id);
      expect(lotsAfter[0].qtyRemaining).toBe(5);

      // Verify no allocations created
      const allocations = await prisma.lotAllocation.findMany();
      expect(allocations.length).toBe(0);

      // Verify no movements created for this product
      const movements = await prisma.inventoryMovement.findMany({
        where: { productId: product.id, type: 'OUT' },
      });
      expect(movements.length).toBe(0);
    });
  });

  describe('Test 3: Write-off consumes FIFO lots', () => {
    it('should allocate write-off qty 7 from lots: 5@100 + 2@200', async () => {
      const product = await createProduct({ title: 'Test Product', price: 500 });

      // Purchase1: 5 @ 100
      await postPurchase({
        items: [{ productId: product.id, qty: 5, unitCost: 100 }],
      });

      // Purchase2: 5 @ 200
      await postPurchase({
        items: [{ productId: product.id, qty: 5, unitCost: 200 }],
      });

      // Write-off qty 7
      const writeOff = await warehouseService.createWriteOff(product.id, 7, 'Test write-off');

      expect(writeOff.qty).toBe(7);
      expect(writeOff.totalCost).toBe(5 * 100 + 2 * 200); // 500 + 400 = 900

      // Verify lot remaining
      const lots = await getLots(product.id);
      const lot1 = lots.find((l) => l.unitCost === 100);
      const lot2 = lots.find((l) => l.unitCost === 200);

      expect(lot1?.qtyRemaining).toBe(0);
      expect(lot2?.qtyRemaining).toBe(3);

      // Verify allocations
      const allocations = await prisma.lotAllocation.findMany({
        where: { writeOffId: writeOff.id },
      });

      expect(allocations.length).toBe(2);
      const allocation1 = allocations.find((a) => a.unitCost === 100);
      const allocation2 = allocations.find((a) => a.unitCost === 200);

      expect(allocation1?.qty).toBe(5);
      expect(allocation2?.qty).toBe(2);
    });
  });

  describe('Test 4: Stock invariants', () => {
    it('stock computed from lots should match stock computed from movements', async () => {
      const product = await createProduct({ title: 'Test Product', price: 1000 });

      // Post purchase: 10 @ 500
      await postPurchase({
        items: [{ productId: product.id, qty: 10, unitCost: 500 }],
      });

      // Create order: 7
      await ordersService.create(null, {
        items: [{ productId: product.id, qty: 7 }],
        customerName: 'Test',
        customerPhone: '+79991234567',
      });

      // Create write-off: 2
      await warehouseService.createWriteOff(product.id, 2, 'Test');

      // Verify stock from lots
      const stockFromLots = await getStockFromLots(product.id);

      // Verify stock from movements
      const stockFromMovements = await getStockFromMovements(product.id);

      // They should match
      expect(stockFromLots).toBe(stockFromMovements);
      expect(stockFromLots).toBe(1); // 10 - 7 - 2 = 1
    });
  });

  describe('Test 5: Idempotency / retry safety', () => {
    it('should not double-consume lots if order creation is called twice with same idempotency key', async () => {
      const product = await createProduct({ title: 'Test Product', price: 1000 });

      // Post purchase: 10 @ 500
      await postPurchase({
        items: [{ productId: product.id, qty: 10, unitCost: 500 }],
      });

      const idempotencyKey = 'test-idempotency-key-123';

      // Create order once with idempotency key
      const order1 = await ordersService.create(null, {
        items: [{ productId: product.id, qty: 5 }],
        customerName: 'Test',
        customerPhone: '+79991234567',
        idempotencyKey,
      });

      // Verify lot remaining is 5
      const lotsAfterFirst = await getLots(product.id);
      expect(lotsAfterFirst[0].qtyRemaining).toBe(5);

      // Get allocations count after first order
      const allocationsAfterFirst = await prisma.lotAllocation.findMany({
        where: { orderItemId: order1.items[0].id },
      });
      const allocationsCountAfterFirst = allocationsAfterFirst.length;

      // Retry order creation with same idempotency key
      const order2 = await ordersService.create(null, {
        items: [{ productId: product.id, qty: 5 }],
        customerName: 'Test',
        customerPhone: '+79991234567',
        idempotencyKey, // Same key
      });

      // Should return the same order
      expect(order2.id).toBe(order1.id);

      // Verify lot remaining is still 5 (not double-consumed)
      const lotsAfterSecond = await getLots(product.id);
      expect(lotsAfterSecond[0].qtyRemaining).toBe(5);

      // Verify allocations were not duplicated
      const allocationsAfterSecond = await prisma.lotAllocation.findMany({
        where: { orderItemId: order1.items[0].id },
      });
      expect(allocationsAfterSecond.length).toBe(allocationsCountAfterFirst);

      // Verify no new movements were created
      const movements = await prisma.inventoryMovement.findMany({
        where: { productId: product.id, sourceId: order1.id },
      });
      expect(movements.length).toBe(1); // Only one movement for the single order
    });
  });

  describe('Additional invariants', () => {
    it('should never have negative lot qtyRemaining', async () => {
      const product = await createProduct({ title: 'Test Product', price: 1000 });

      await postPurchase({
        items: [{ productId: product.id, qty: 10, unitCost: 500 }],
      });

      await ordersService.create(null, {
        items: [{ productId: product.id, qty: 10 }],
        customerName: 'Test',
        customerPhone: '+79991234567',
      });

      const lots = await getLots(product.id);
      lots.forEach((lot) => {
        expect(lot.qtyRemaining).toBeGreaterThanOrEqual(0);
      });
    });

    it('allocations sum should equal order item qty', async () => {
      const product = await createProduct({ title: 'Test Product', price: 1000 });

      await postPurchase({
        items: [
          { productId: product.id, qty: 10, unitCost: 500 },
          { productId: product.id, qty: 10, unitCost: 700 },
        ],
      });

      const order = await ordersService.create(null, {
        items: [{ productId: product.id, qty: 15 }],
        customerName: 'Test',
        customerPhone: '+79991234567',
      });

      const orderItem = order.items[0];
      const allocations = await getAllocationsForOrderItem(orderItem.id);

      const allocationsSum = allocations.reduce((sum, a) => sum + a.qty, 0);
      expect(allocationsSum).toBe(orderItem.qty);
      expect(allocationsSum).toBe(15);
    });

    it('COGS should equal sum of allocation qty * unitCost', async () => {
      const product = await createProduct({ title: 'Test Product', price: 1000 });

      await postPurchase({
        items: [
          { productId: product.id, qty: 10, unitCost: 500 },
          { productId: product.id, qty: 10, unitCost: 700 },
        ],
      });

      const order = await ordersService.create(null, {
        items: [{ productId: product.id, qty: 12 }],
        customerName: 'Test',
        customerPhone: '+79991234567',
      });

      const orderItem = order.items[0];
      const allocations = await getAllocationsForOrderItem(orderItem.id);

      const calculatedCogs = allocations.reduce((sum, a) => sum + a.qty * a.unitCost, 0);
      expect(orderItem.cogsTotal).toBe(calculatedCogs);
      expect(calculatedCogs).toBe(10 * 500 + 2 * 700);
    });
  });
});

