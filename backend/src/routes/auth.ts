import { Router } from 'express';
import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';

const router = Router();

const mockUser = {
  id: 'user-1',
  email: 'msa@monistar.com',
  passwordHash: bcrypt.hashSync('demo1234', 10),
  name: 'MSa Monistar',
};

router.post('/login', async (req, res) => {
  const { email, password } = req.body;
  if (email !== mockUser.email || !(await bcrypt.compare(password, mockUser.passwordHash))) {
    return res.status(401).json({ error: 'Invalid credentials' });
  }

  const token = jwt.sign({ sub: mockUser.id, email: mockUser.email }, process.env.JWT_SECRET || 'secret', {
    expiresIn: '7d',
  });

  res.json({ token, user: { id: mockUser.id, email: mockUser.email, name: mockUser.name } });
});

export default router;
