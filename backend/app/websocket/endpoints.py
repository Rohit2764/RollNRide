from fastapi import APIRouter, WebSocket, WebSocketDisconnect
from app.websocket.manager import ws_manager

router = APIRouter()

@router.websocket("/ws/fleet")
async def websocket_fleet(websocket: WebSocket):
    await ws_manager.connect(websocket, "fleet")
    try:
        while True:
            # Keep-alive ping/pong
            await websocket.receive_text()
    except WebSocketDisconnect:
        ws_manager.disconnect(websocket, "fleet")

@router.websocket("/ws/dashboard")
async def websocket_dashboard(websocket: WebSocket):
    await ws_manager.connect(websocket, "dashboard")
    try:
        while True:
            await websocket.receive_text()
    except WebSocketDisconnect:
        ws_manager.disconnect(websocket, "dashboard")

@router.websocket("/ws/traffic")
async def websocket_traffic(websocket: WebSocket):
    await ws_manager.connect(websocket, "traffic")
    try:
        while True:
            await websocket.receive_text()
    except WebSocketDisconnect:
        ws_manager.disconnect(websocket, "traffic")

@router.websocket("/ws/notifications")
async def websocket_notifications(websocket: WebSocket):
    await ws_manager.connect(websocket, "notifications")
    try:
        while True:
            await websocket.receive_text()
    except WebSocketDisconnect:
        ws_manager.disconnect(websocket, "notifications")

@router.websocket("/ws/warehouse/{warehouse_id}")
async def websocket_warehouse(websocket: WebSocket, warehouse_id: int):
    channel = f"warehouse:{warehouse_id}"
    await ws_manager.connect(websocket, channel)
    try:
        while True:
            await websocket.receive_text()
    except WebSocketDisconnect:
        ws_manager.disconnect(websocket, channel)
