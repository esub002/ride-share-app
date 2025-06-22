const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

exports.createUser = async (req, res) => {
  const { name, email, role } = req.body;
  try {
    const user = await prisma.user.create({ data: { name, email, role } });
    res.status(201).json(user);
  } catch (err) {
    console.error('Create User Error:', err.message);
    res.status(500).json({ error: err.message });
  }
};

exports.getUser = async (req, res) => {
  const { id } = req.params;
  try {
    const user = await prisma.user.findUnique({ where: { id: Number(id) } });
    res.json(user);
  } catch (err) {
    console.error('Get User Error:', err.message);
    res.status(500).json({ error: 'User not found' });
  }
};
