import React, { useState, useEffect, useRef } from 'react';
import { useQueryClient } from '@tanstack/react-query';
import { RealtimeData } from '@shared/schema';

interface WebSocketMessage {
  type: string;
  data: any;
}

interface UseWebSocketReturn {
  data: RealtimeData | null;
  isConnected: boolean;
  error: string | null;
}

export function useWebSocket(): UseWebSocketReturn {
  const [data, setData] = useState<RealtimeData | null>(null);
  const [isConnected, setIsConnected] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const wsRef = useRef<WebSocket | null>(null);
  const reconnectTimeoutRef = useRef<NodeJS.Timeout>();
  const queryClient = useQueryClient();

  const connect = () => {
    try {
      const protocol = window.location.protocol === "https:" ? "wss:" : "ws:";
      const wsUrl = `${protocol}//${window.location.host}/ws`;
      
      wsRef.current = new WebSocket(wsUrl);

      wsRef.current.onopen = () => {
        console.log('WebSocket connected');
        setIsConnected(true);
        setError(null);
      };

      wsRef.current.onmessage = (event) => {
        try {
          const message: WebSocketMessage = JSON.parse(event.data);
          if (message.type === 'realtime_update') {
            setData(message.data);
            
            // Hydrate React Query caches with real-time data
            if (message.data) {
              // Update machines cache
              if (message.data.machines) {
                queryClient.setQueryData(['/api/machines'], message.data.machines);
                queryClient.setQueryData(['/api/dashboard/realtime'], message.data);
              }
              
              // Invalidate related queries to trigger refetch
              queryClient.invalidateQueries({ queryKey: ['/api/work-orders'] });
              queryClient.invalidateQueries({ queryKey: ['/api/work-orders/active'] });
              queryClient.invalidateQueries({ queryKey: ['/api/inventory'] });
              queryClient.invalidateQueries({ queryKey: ['/api/alerts'] });
              queryClient.invalidateQueries({ queryKey: ['/api/alerts/unread'] });
              queryClient.invalidateQueries({ queryKey: ['/api/quality/records'] });
              queryClient.invalidateQueries({ queryKey: ['/api/production-logs'] });
              queryClient.invalidateQueries({ queryKey: ['/api/downtime-events'] });
              queryClient.invalidateQueries({ queryKey: ['/api/schedule/slots'] });
              queryClient.invalidateQueries({ queryKey: ['/api/analytics'] });
              queryClient.invalidateQueries({ queryKey: ['/api/dashboard/kpis'] });
            }
          }
        } catch (err) {
          console.error('Failed to parse WebSocket message:', err);
        }
      };

      wsRef.current.onclose = () => {
        console.log('WebSocket disconnected');
        setIsConnected(false);
        
        // Attempt to reconnect after 3 seconds
        reconnectTimeoutRef.current = setTimeout(() => {
          connect();
        }, 3000);
      };

      wsRef.current.onerror = (event) => {
        console.error('WebSocket error:', event);
        setError('WebSocket connection failed');
        setIsConnected(false);
      };
    } catch (err) {
      console.error('Failed to create WebSocket connection:', err);
      setError('Failed to create WebSocket connection');
    }
  };

  useEffect(() => {
    connect();

    return () => {
      if (reconnectTimeoutRef.current) {
        clearTimeout(reconnectTimeoutRef.current);
      }
      if (wsRef.current) {
        wsRef.current.close();
      }
    };
  }, []);

  return { data, isConnected, error };
}
