import { useCallback, useEffect, useMemo, useState } from "react";
import type { ControlRoomSnapshot, FeedPost, PersonaInit } from "@faultline/contracts";

import {
  ApiError,
  initializeAgent,
  retrieveControlRoom,
  retrieveFeed,
} from "../lib/api";

const STORAGE_KEY = "faultline.connectedAgentId";
const POLL_INTERVAL_MS = 30_000;

function readInitialAgentId(): string | null {
  const queryAgentId = new URLSearchParams(window.location.search).get("agentId");
  if (queryAgentId?.trim()) return queryAgentId.trim();
  return window.localStorage.getItem(STORAGE_KEY);
}

function messageFor(error: unknown): string {
  return error instanceof ApiError
    ? error.message
    : "An unexpected interface error occurred.";
}

export interface AgentControlRoomState {
  agentId: string | null;
  posts: FeedPost[];
  snapshot: ControlRoomSnapshot | null;
  feedError: string | null;
  telemetryError: string | null;
  initializationError: string | null;
  isLoading: boolean;
  isRefreshing: boolean;
  isInitializing: boolean;
  lastSyncedAt: string | null;
  initialize: (persona: PersonaInit) => Promise<void>;
  connect: (agentId: string) => void;
  disconnect: () => void;
  refresh: () => Promise<void>;
}

export function useAgentControlRoom(): AgentControlRoomState {
  const [agentId, setAgentId] = useState<string | null>(readInitialAgentId);
  const [posts, setPosts] = useState<FeedPost[]>([]);
  const [snapshot, setSnapshot] = useState<ControlRoomSnapshot | null>(null);
  const [feedError, setFeedError] = useState<string | null>(null);
  const [telemetryError, setTelemetryError] = useState<string | null>(null);
  const [initializationError, setInitializationError] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(agentId !== null);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [isInitializing, setIsInitializing] = useState(false);
  const [lastSyncedAt, setLastSyncedAt] = useState<string | null>(null);

  const refresh = useCallback(async (): Promise<void> => {
    if (agentId === null) return;
    setIsRefreshing(true);
    const controller = new AbortController();

    const [feedResult, telemetryResult] = await Promise.allSettled([
      retrieveFeed(agentId, controller.signal),
      retrieveControlRoom(agentId, controller.signal),
    ]);

    if (feedResult.status === "fulfilled") {
      setPosts(feedResult.value);
      setFeedError(null);
    } else {
      setFeedError(messageFor(feedResult.reason));
    }

    if (telemetryResult.status === "fulfilled") {
      setSnapshot(telemetryResult.value);
      setTelemetryError(null);
    } else {
      setTelemetryError(messageFor(telemetryResult.reason));
    }

    setLastSyncedAt(new Date().toISOString());
    setIsLoading(false);
    setIsRefreshing(false);
  }, [agentId]);

  useEffect(() => {
    if (agentId === null) return;
    void refresh();
    const poll = window.setInterval(() => void refresh(), POLL_INTERVAL_MS);
    return () => window.clearInterval(poll);
  }, [agentId, refresh]);

  const initialize = useCallback(async (persona: PersonaInit): Promise<void> => {
    setIsInitializing(true);
    setInitializationError(null);
    try {
      const initializedAgentId = await initializeAgent(persona);
      window.localStorage.setItem(STORAGE_KEY, initializedAgentId);
      setAgentId(initializedAgentId);
      setIsLoading(true);
    } catch (error) {
      setInitializationError(messageFor(error));
    } finally {
      setIsInitializing(false);
    }
  }, []);

  const connect = useCallback((value: string): void => {
    const normalized = value.trim();
    if (!normalized) return;
    window.localStorage.setItem(STORAGE_KEY, normalized);
    setInitializationError(null);
    setAgentId(normalized);
    setIsLoading(true);
  }, []);

  const disconnect = useCallback((): void => {
    window.localStorage.removeItem(STORAGE_KEY);
    setAgentId(null);
    setPosts([]);
    setSnapshot(null);
    setFeedError(null);
    setTelemetryError(null);
    setLastSyncedAt(null);
    setIsLoading(false);
  }, []);

  return useMemo(
    () => ({
      agentId,
      posts,
      snapshot,
      feedError,
      telemetryError,
      initializationError,
      isLoading,
      isRefreshing,
      isInitializing,
      lastSyncedAt,
      initialize,
      connect,
      disconnect,
      refresh,
    }),
    [
      agentId,
      posts,
      snapshot,
      feedError,
      telemetryError,
      initializationError,
      isLoading,
      isRefreshing,
      isInitializing,
      lastSyncedAt,
      initialize,
      connect,
      disconnect,
      refresh,
    ],
  );
}
