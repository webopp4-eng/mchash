import { Router, Request, Response } from 'express';
import { z } from 'zod';
import { v4 as uuid } from 'uuid';
import prisma from '../lib/prisma';
import { authenticateToken, loadUser } from '../middleware/auth';
import { isValidPayoutMethod } from '../lib/payoutValidation';

interface AuthRequest extends Request {
  user?: any;
}

const router = Router();

/**
 * GET /api/payout-methods
 * Get all payout methods for the authenticated user
 */
router.get('/', authenticateToken, loadUser, async (req: AuthRequest, res: Response) => {
  try {
    const user = req.user;
    if (!user) {
      return res.status(401).json({ error: 'Not authenticated' });
    }

    const payoutMethods = await prisma.payoutMethod.findMany({
      where: { userId: user.id },
      select: {
        id: true,
        type: true,
        name: true,
        network: true,
        address: true,
        solanaAddress: true,
        momoNumber: true,
        momoName: true,
        bankName: true,
        accountHolder: true,
        accountNumber: true,
        bankCode: true,
        isDefault: true,
        active: true,
        createdAt: true,
      },
      orderBy: [{ isDefault: 'desc' }, { createdAt: 'desc' }],
    });

    res.json({ payoutMethods });
  } catch (error) {
    console.error('Get payout methods error:', error);
    res.status(500).json({ error: 'Failed to fetch payout methods' });
  }
});

/**
 * GET /api/payout-methods/:id
 * Get a specific payout method
 */
router.get('/:id', authenticateToken, loadUser, async (req: AuthRequest, res: Response) => {
  try {
    const user = req.user;
    if (!user) {
      return res.status(401).json({ error: 'Not authenticated' });
    }

    const payoutMethod = await prisma.payoutMethod.findUnique({
      where: { id: req.params.id },
    });

    if (!payoutMethod) {
      return res.status(404).json({ error: 'Payout method not found' });
    }

    // Verify ownership
    if (payoutMethod.userId !== user.id) {
      return res.status(403).json({ error: 'Access denied' });
    }

    res.json({ payoutMethod });
  } catch (error) {
    console.error('Get payout method error:', error);
    res.status(500).json({ error: 'Failed to fetch payout method' });
  }
});

/**
 * POST /api/payout-methods
 * Create a new payout method
 */
const createPayoutMethodSchema = z.object({
  type: z.enum(['crypto', 'solana', 'momo', 'bank']),
  name: z.string().min(1).max(100),
  network: z.string().optional(), // For crypto
  address: z.string().optional(), // For crypto
  solanaAddress: z.string().optional(),
  momoNumber: z.string().optional(),
  momoName: z.string().optional(),
  bankName: z.string().optional(),
  accountHolder: z.string().optional(),
  accountNumber: z.string().optional(),
  bankCode: z.string().optional(),
});

router.post('/', authenticateToken, loadUser, async (req: AuthRequest, res: Response) => {
  try {
    const user = req.user;
    if (!user) {
      return res.status(401).json({ error: 'Not authenticated' });
    }

    const parsed = createPayoutMethodSchema.safeParse(req.body);
    if (!parsed.success) {
      return res.status(400).json({ error: 'Invalid request data', details: parsed.error.errors });
    }

    // Validate the payout method data
    const validation = isValidPayoutMethod(parsed.data.type, parsed.data);
    if (!validation.valid) {
      return res.status(400).json({ error: validation.error });
    }

    // If setting as default, unset previous default
    if (req.body.isDefault) {
      await prisma.payoutMethod.updateMany({
        where: { userId: user.id, isDefault: true },
        data: { isDefault: false },
      });
    }

    const payoutMethod = await prisma.payoutMethod.create({
      data: {
        id: uuid(),
        userId: user.id,
        type: parsed.data.type,
        name: parsed.data.name,
        network: parsed.data.network,
        address: parsed.data.address,
        solanaAddress: parsed.data.solanaAddress,
        momoNumber: parsed.data.momoNumber,
        momoName: parsed.data.momoName,
        bankName: parsed.data.bankName,
        accountHolder: parsed.data.accountHolder,
        accountNumber: parsed.data.accountNumber,
        bankCode: parsed.data.bankCode,
        isDefault: req.body.isDefault || false,
        updatedAt: new Date(),
      },
    });

    res.status(201).json({
      payoutMethod: {
        id: payoutMethod.id,
        type: payoutMethod.type,
        name: payoutMethod.name,
        isDefault: payoutMethod.isDefault,
        createdAt: payoutMethod.createdAt,
      },
    });
  } catch (error) {
    console.error('Create payout method error:', error);
    res.status(500).json({ error: 'Failed to create payout method' });
  }
});

/**
 * PATCH /api/payout-methods/:id
 * Update a payout method
 */
const updatePayoutMethodSchema = z.object({
  name: z.string().min(1).max(100).optional(),
  network: z.string().optional(),
  address: z.string().optional(),
  solanaAddress: z.string().optional(),
  momoNumber: z.string().optional(),
  momoName: z.string().optional(),
  bankName: z.string().optional(),
  accountHolder: z.string().optional(),
  accountNumber: z.string().optional(),
  bankCode: z.string().optional(),
  isDefault: z.boolean().optional(),
});

router.patch('/:id', authenticateToken, loadUser, async (req: AuthRequest, res: Response) => {
  try {
    const user = req.user;
    if (!user) {
      return res.status(401).json({ error: 'Not authenticated' });
    }

    const payoutMethod = await prisma.payoutMethod.findUnique({
      where: { id: req.params.id },
    });

    if (!payoutMethod) {
      return res.status(404).json({ error: 'Payout method not found' });
    }

    // Verify ownership
    if (payoutMethod.userId !== user.id) {
      return res.status(403).json({ error: 'Access denied' });
    }

    const parsed = updatePayoutMethodSchema.safeParse(req.body);
    if (!parsed.success) {
      return res.status(400).json({ error: 'Invalid request data', details: parsed.error.errors });
    }

    // If updating to default, unset previous default
    if (parsed.data.isDefault) {
      await prisma.payoutMethod.updateMany({
        where: { userId: user.id, isDefault: true, id: { not: req.params.id } },
        data: { isDefault: false },
      });
    }

    const updated = await prisma.payoutMethod.update({
      where: { id: req.params.id },
      data: {
        name: parsed.data.name,
        network: parsed.data.network,
        address: parsed.data.address,
        solanaAddress: parsed.data.solanaAddress,
        momoNumber: parsed.data.momoNumber,
        momoName: parsed.data.momoName,
        bankName: parsed.data.bankName,
        accountHolder: parsed.data.accountHolder,
        accountNumber: parsed.data.accountNumber,
        bankCode: parsed.data.bankCode,
        ...(typeof parsed.data.isDefault === 'boolean' && { isDefault: parsed.data.isDefault }),
      },
    });

    res.json({ payoutMethod: updated });
  } catch (error) {
    console.error('Update payout method error:', error);
    res.status(500).json({ error: 'Failed to update payout method' });
  }
});

/**
 * DELETE /api/payout-methods/:id
 * Delete a payout method
 */
router.delete('/:id', authenticateToken, loadUser, async (req: AuthRequest, res: Response) => {
  try {
    const user = req.user;
    if (!user) {
      return res.status(401).json({ error: 'Not authenticated' });
    }

    const payoutMethod = await prisma.payoutMethod.findUnique({
      where: { id: req.params.id },
    });

    if (!payoutMethod) {
      return res.status(404).json({ error: 'Payout method not found' });
    }

    // Verify ownership
    if (payoutMethod.userId !== user.id) {
      return res.status(403).json({ error: 'Access denied' });
    }

    // Check if this is the last payout method
    const count = await prisma.payoutMethod.count({
      where: { userId: user.id, active: true },
    });

    if (count <= 1) {
      return res.status(400).json({ error: 'Cannot delete your last payout method' });
    }

    await prisma.payoutMethod.delete({
      where: { id: req.params.id },
    });

    res.json({ success: true, message: 'Payout method deleted' });
  } catch (error) {
    console.error('Delete payout method error:', error);
    res.status(500).json({ error: 'Failed to delete payout method' });
  }
});

/**
 * PATCH /api/payout-methods/:id/set-default
 * Set a payout method as default
 */
router.patch('/:id/set-default', authenticateToken, loadUser, async (req: AuthRequest, res: Response) => {
  try {
    const user = req.user;
    if (!user) {
      return res.status(401).json({ error: 'Not authenticated' });
    }

    const payoutMethod = await prisma.payoutMethod.findUnique({
      where: { id: req.params.id },
    });

    if (!payoutMethod) {
      return res.status(404).json({ error: 'Payout method not found' });
    }

    // Verify ownership
    if (payoutMethod.userId !== user.id) {
      return res.status(403).json({ error: 'Access denied' });
    }

    // Unset previous default
    await prisma.payoutMethod.updateMany({
      where: { userId: user.id, isDefault: true },
      data: { isDefault: false },
    });

    // Set new default
    const updated = await prisma.payoutMethod.update({
      where: { id: req.params.id },
      data: { isDefault: true },
    });

    res.json({ payoutMethod: updated, message: 'Default payout method updated' });
  } catch (error) {
    console.error('Set default payout method error:', error);
    res.status(500).json({ error: 'Failed to set default payout method' });
  }
});

export default router;
