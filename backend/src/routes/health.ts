import { Router } from 'express';

const router = Router();

router.get('/', (_, res) => {
  res.json({ status: 'ok', name: 'CM HASH API' });
});

export default router;
