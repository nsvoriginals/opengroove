import { Router } from 'express';
import { getRoom, getRoomByCode, getRoomUsers, roomExists } from '../services/room.service.js';
import { getQueue } from '../services/queue.service.js';
import { getPlaybackState } from '../services/playback.service.js';
const router: Router = Router();

router.get('/:roomId', async (req, res) => {
  try {
    const { roomId } = req.params;
    const room = await getRoom(roomId);

    if (!room) {
      return res.status(404).json({ success: false, error: 'Room not found' });
    }

    res.json({ success: true, room });
  } catch (error) {
    res.status(500).json({ success: false, error: error instanceof Error ? error.message : 'Failed to get room' });
  }
});

router.get('/code/:code', async (req, res) => {
  try {
    const { code } = req.params;
    const room = await getRoomByCode(code.toUpperCase());

    if (!room) {
      return res.status(404).json({ success: false, error: 'Room not found' });
    }

    res.json({ success: true, room });
  } catch (error) {
    res.status(500).json({ success: false, error: error instanceof Error ? error.message : 'Failed to get room' });
  }
});

router.get('/:roomId/users', async (req, res) => {
  try {
    const { roomId } = req.params;
    const users = await getRoomUsers(roomId);

    res.json({ success: true, users });
  } catch (error) {
    res.status(500).json({ success: false, error: error instanceof Error ? error.message : 'Failed to get users' });
  }
});

router.get('/:roomId/queue', async (req, res) => {
  try {
    const { roomId } = req.params;
    const queue = await getQueue(roomId);

    res.json({ success: true, queue });
  } catch (error) {
    res.status(500).json({ success: false, error: error instanceof Error ? error.message : 'Failed to get queue' });
  }
});

router.get('/:roomId/playback', async (req, res) => {
  try {
    const { roomId } = req.params;
    const playbackState = await getPlaybackState(roomId);

    res.json({ success: true, playbackState });
  } catch (error) {
    res.status(500).json({ success: false, error: error instanceof Error ? error.message : 'Failed to get playback state' });
  }
});

router.get('/:roomId/exists', async (req, res) => {
  try {
    const { roomId } = req.params;
    const exists = await roomExists(roomId);

    res.json({ success: true, exists });
  } catch (error) {
    res.status(500).json({ success: false, error: error instanceof Error ? error.message : 'Failed to check room' });
  }
});

export default router;
