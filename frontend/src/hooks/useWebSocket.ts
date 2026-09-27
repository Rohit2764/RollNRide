import { useEffect, useRef } from 'react';
import { useQueryClient } from '@tanstack/react-query';

export function useWebSocket(channel: 'fleet' | 'dashboard' | 'traffic' | 'notifications' = 'dashboard') {
  const queryClient = useQueryClient();
  const socketRef = useRef<WebSocket | null>(null);

  useEffect(() => {
    const protocol = window.location.protocol === 'https:' ? 'wss:' : 'ws:';
    const host = window.location.host;
    const wsUrl = `${protocol}//${host}/ws/${channel}`;

    const ws = new WebSocket(wsUrl);
    socketRef.current = ws;

    ws.onopen = () => {
      // Keepalive ping every 25s
      const pingInterval = setInterval(() => {
        if (ws.readyState === WebSocket.OPEN) {
          ws.send('ping');
        }
      }, 25000);

      ws.onclose = () => clearInterval(pingInterval);
    };

    ws.onmessage = (event) => {
      try {
        const payload = JSON.parse(event.data);
        const eventType = payload.event;

        if (eventType === 'vehicle_location_updated') {
          queryClient.invalidateQueries({ queryKey: ['liveFleet'] });
        } else if (eventType === 'warehouse_load_changed') {
          queryClient.invalidateQueries({ queryKey: ['warehouses'] });
          queryClient.invalidateQueries({ queryKey: ['dashboardAnalytics'] });
        } else if (eventType === 'booking_created' || eventType === 'booking_completed') {
          queryClient.invalidateQueries({ queryKey: ['bookings'] });
          queryClient.invalidateQueries({ queryKey: ['dashboardAnalytics'] });
          queryClient.invalidateQueries({ queryKey: ['liveFleet'] });
          queryClient.invalidateQueries({ queryKey: ['warehouses'] });
        }
      } catch {
        // Ignore unparseable frames
      }
    };

    return () => {
      if (ws.readyState === WebSocket.OPEN || ws.readyState === WebSocket.CONNECTING) {
        ws.close();
      }
    };
  }, [channel, queryClient]);

  return socketRef.current;
}
