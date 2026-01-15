import { useEffect } from 'react';
import { io, Socket } from 'socket.io-client';
import { useQueryClient } from '@tanstack/react-query';
import type { Visitor } from '@live-chat/shared-types';
import { WebSocketEvent, type VisitorStatusChangedPayload } from '@live-chat/shared-types'; // ADDED 'type' keyword

interface VisitorUpdatedPayload {
  projectId: number;
  visitorId: number;
  visitor: Visitor;
}

const SOCKET_URL = import.meta.env.VITE_API_BASE_URL?.replace("/api/v1", "");

export const useVisitorEvents = (projectId?: number) => {
  const queryClient = useQueryClient();

  useEffect(() => {
    if (!projectId || !SOCKET_URL) {
      console.warn('useVisitorEvents: Missing projectId or SOCKET_URL, skipping socket connection.');
      return;
    }

    const socket: Socket = io(SOCKET_URL, {
      path: '/socket.io', // Default path for Socket.IO, confirm if different in backend
      auth: {
        token: localStorage.getItem('accessToken'), // Assuming JWT token is stored here
      },
      query: { projectId }, // Pass projectId in query for room joining
    });

    socket.on('connect', () => {
      console.log(`Socket connected for project ${projectId}, ID: ${socket.id}`);
      // Join a project-specific room on connection
      socket.emit('joinProjectRoom', { projectId });
    });

    socket.on('disconnect', () => {
      console.log(`Socket disconnected for project ${projectId}`);
    });

    socket.on('connect_error', (err) => {
      console.error(`Socket connection error for project ${projectId}:`, err);
    });

    socket.on('visitorUpdated', (payload: VisitorUpdatedPayload) => {
      console.log(`Received visitorUpdated event for project ${payload.projectId}, visitor ${payload.visitorId}`);
      // Invalidate relevant queries to refetch data
      queryClient.invalidateQueries({ queryKey: ['conversations', payload.projectId] });
      queryClient.invalidateQueries({ queryKey: ['visitor', payload.visitorId] });
      // queryClient.invalidateQueries({ queryKey: ['visitor', payload.visitor.visitorUid] }); // This key might not be used
    });

    // NEW: Listener for VISITOR_STATUS_CHANGED event
    socket.on(WebSocketEvent.VISITOR_STATUS_CHANGED, (payload: VisitorStatusChangedPayload) => {
      console.log(`Received VISITOR_STATUS_CHANGED event for visitorUid: ${payload.visitorUid}, isOnline: ${payload.isOnline}`);

      // Find all queries that fetch 'visitor' data and update their 'isOnline' status
      const visitorQueries = queryClient.getQueryCache().findAll({ queryKey: ['visitor'] });

      visitorQueries.forEach(query => {
        const cachedVisitor = query.state.data as Visitor | undefined;
        if (cachedVisitor && cachedVisitor.visitorUid === payload.visitorUid) {
          queryClient.setQueryData(query.queryKey, (old: Visitor | undefined) => {
            if (old) {
              return { ...old, isOnline: payload.isOnline };
            }
            return old;
          });
        }
      });
    });

    return () => {
      console.log(`Disconnecting socket for project ${projectId}`);
      socket.off('connect');
      socket.off('disconnect');
      socket.off('connect_error');
      socket.off('visitorUpdated');
      socket.off(WebSocketEvent.VISITOR_STATUS_CHANGED); // CLEANUP ADDED
      socket.disconnect();
    };
  }, [projectId, queryClient]); // Re-run effect if projectId or queryClient changes
};
