from typing import Dict, List, Set
from fastapi import WebSocket
import json
import logging

logger = logging.getLogger("rollnride.websocket")

class ConnectionManager:
    def __init__(self):
        # Global channels: "fleet", "dashboard", "traffic", "notifications"
        self.channel_connections: Dict[str, Set[WebSocket]] = {
            "fleet": set(),
            "dashboard": set(),
            "traffic": set(),
            "notifications": set(),
        }
        # Parameterized channels: e.g. "warehouse:1"
        self.dynamic_connections: Dict[str, Set[WebSocket]] = {}

    async def connect(self, websocket: WebSocket, channel: str):
        await websocket.accept()
        if channel in self.channel_connections:
            self.channel_connections[channel].add(websocket)
        else:
            if channel not in self.dynamic_connections:
                self.dynamic_connections[channel] = set()
            self.dynamic_connections[channel].add(websocket)
        logger.debug(f"Client connected to channel: {channel}")

    def disconnect(self, websocket: WebSocket, channel: str):
        if channel in self.channel_connections:
            self.channel_connections[channel].discard(websocket)
        elif channel in self.dynamic_connections:
            self.dynamic_connections[channel].discard(websocket)
            if not self.dynamic_connections[channel]:
                del self.dynamic_connections[channel]
        logger.debug(f"Client disconnected from channel: {channel}")

    async def broadcast(self, channel: str, message: dict):
        message_str = json.dumps(message)
        targets = []
        if channel in self.channel_connections:
            targets = list(self.channel_connections[channel])
        elif channel in self.dynamic_connections:
            targets = list(self.dynamic_connections[channel])

        for connection in targets:
            try:
                await connection.send_text(message_str)
            except Exception:
                # Connection broken, will be cleaned up
                self.disconnect(connection, channel)

    async def broadcast_event(self, event_type: str, data: dict, channels: List[str]):
        payload = {
            "event": event_type,
            "data": data
        }
        for ch in channels:
            await self.broadcast(ch, payload)

ws_manager = ConnectionManager()
