/** biome-ignore-all lint/a11y/useMediaCaption: <explanation> */
/** biome-ignore-all lint/correctness/useExhaustiveDependencies: <explanation> */
/** biome-ignore-all lint/suspicious/useIterableCallbackReturn: <explanation> */
"use client";

import React, { useCallback, useEffect, useMemo, useState } from "react";
import {
  Mic,
  MicOff,
  Video as VideoIcon,
  VideoOff,
  PhoneOff,
  PhoneCall,
  MonitorUp,
  Minimize2,
  Maximize2,
  ShieldCheck,
  Users,
  Hand,
  Pin,
  PinOff,
  BellRing,
  UserPlus,
} from "lucide-react";
import {
  Avatar,
  AvatarFallback,
  AvatarImage,
  LiquidGlass,
  LiquidGlassModal,
  PatternButton,
  GlassAvatar,
} from "@/components/toolkit";
import { ScrollArea } from "@/components/ui/scroll-area";
import { useChatStore } from "@/lib/stores/chat/use-chat-store";
import { useAuthStore } from "@/lib/stores/auth/use-auth-store";
import {
  CallStatusEnum,
  CallTypeEnum,
  ConversationTypeEnum,
  SocketNamespaceEnum,
} from "@/common/enum";
import { SOCKET_EVENTS } from "@/constant/socket-events";
import { socketService } from "@/services/socket/socket-client";
import { getIceServersApi } from "@/lib/stores/chat/api";
import { toast } from "sonner";
import { cn } from "@/lib/utils";
import { useTranslations } from "next-intl";

interface RemotePeerTileProps {
  userId: string;
  name: string;
  avatar?: string | null;
  stream?: MediaStream;
  isAudioMuted?: boolean;
  isVideoOff?: boolean;
  isScreenSharing?: boolean;
  isHandRaised?: boolean;
  isSingleRemote?: boolean;
  isPinned?: boolean;
  isHost?: boolean;
  connectingLabel: string;
  onTogglePin?: (userId: string) => void;
  onHostMute?: (userId: string) => void;
}

interface ICallRuntimeContext {
  localVideoEl: HTMLVideoElement | null;
  peers: Map<string, RTCPeerConnection>;
  localStream: MediaStream | null;
  screenStream: MediaStream | null;
  pendingCandidates: Map<string, RTCIceCandidateInit[]>;
  iceServersCache: RTCIceServer[] | null;
  initiatedOffers: Set<string>;
  makingOffer: Map<string, boolean>;
  ignoreOffer: Map<string, boolean>;
}

const createCallRuntimeContext = (): ICallRuntimeContext => ({
  localVideoEl: null,
  peers: new Map<string, RTCPeerConnection>(),
  localStream: null,
  screenStream: null,
  pendingCandidates: new Map<string, RTCIceCandidateInit[]>(),
  iceServersCache: null,
  initiatedOffers: new Set<string>(),
  makingOffer: new Map<string, boolean>(),
  ignoreOffer: new Map<string, boolean>(),
});

const RemotePeerTile = React.memo(
  ({
    userId,
    name,
    avatar,
    stream,
    isAudioMuted,
    isVideoOff,
    isScreenSharing,
    isHandRaised,
    isSingleRemote,
    isPinned,
    isHost,
    connectingLabel,
    onTogglePin,
    onHostMute,
  }: RemotePeerTileProps) => {
    const [videoEl, setVideoEl] = useState<HTMLVideoElement | null>(null);
    const [isSpeaking, setIsSpeaking] = useState(false);

    useEffect(() => {
      if (videoEl && stream && videoEl.srcObject !== stream) {
        videoEl.srcObject = stream;
      }
    }, [videoEl, stream]);

    useEffect(() => {
      if (!stream || isAudioMuted || stream.getAudioTracks().length === 0) {
        setIsSpeaking(false);
        return;
      }

      let audioCtx: AudioContext | null = null;
      let intervalId: ReturnType<typeof setInterval> | null = null;

      try {
        const AudioContextClass =
          window.AudioContext || (window as any).webkitAudioContext;
        audioCtx = new AudioContextClass();
        const source = audioCtx.createMediaStreamSource(stream);
        const analyser = audioCtx.createAnalyser();
        analyser.fftSize = 256;
        source.connect(analyser);

        const dataArray = new Uint8Array(analyser.frequencyBinCount);
        intervalId = setInterval(() => {
          analyser.getByteFrequencyData(dataArray);
          const avg =
            dataArray.reduce((sum, val) => sum + val, 0) / dataArray.length;
          setIsSpeaking(avg > 18);
        }, 220);
      } catch {
        setIsSpeaking(false);
      }

      return () => {
        if (intervalId) clearInterval(intervalId);
        if (audioCtx && audioCtx.state !== "closed") {
          audioCtx.close().catch(() => undefined);
        }
      };
    }, [stream, isAudioMuted]);

    const hasActiveVideo = Boolean(stream && !isVideoOff);

    return (
      <div
        className={cn(
          "group/tile relative overflow-hidden flex items-center justify-center bg-slate-900/80 border transition-all duration-200",
          isSingleRemote
            ? "w-full h-full rounded-none border-0"
            : "rounded-2xl h-full w-full min-h-[140px] sm:min-h-[160px] shadow-lg",
          isSpeaking
            ? "border-emerald-400 ring-2 ring-emerald-400/60"
            : "border-white/15",
        )}
      >
        <video
          ref={setVideoEl}
          autoPlay
          playsInline
          className={cn(
            "w-full h-full transition-opacity duration-300",
            isScreenSharing ? "object-contain bg-black" : "object-cover",
            hasActiveVideo ? "opacity-100" : "opacity-0 pointer-events-none",
          )}
        />

        {/* Huy hiệu Giơ tay phát biểu (Google Meet Style) */}
        {isHandRaised && (
          <div className="absolute top-3 left-3 z-20 flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-amber-500 text-slate-950 text-xs font-bold shadow-lg animate-bounce">
            <Hand className="w-3.5 h-3.5" />
          </div>
        )}

        {/* Thanh công cụ Ghim màn hình & Host Mute khi Hover */}
        <div className="absolute top-3 right-3 z-20 flex items-center gap-1.5 opacity-0 group-hover/tile:opacity-100 transition-opacity">
          {onTogglePin && (
            <button
              type="button"
              onClick={() => onTogglePin(userId)}
              className="p-1.5 rounded-full bg-black/60 text-white hover:bg-black/80 cursor-pointer"
            >
              {isPinned ? (
                <PinOff className="w-3.5 h-3.5 text-primary" />
              ) : (
                <Pin className="w-3.5 h-3.5" />
              )}
            </button>
          )}
          {isHost && !isAudioMuted && onHostMute && (
            <button
              type="button"
              onClick={() => onHostMute(userId)}
              className="p-1.5 rounded-full bg-red-600/80 text-white hover:bg-red-600 cursor-pointer"
            >
              <MicOff className="w-3.5 h-3.5" />
            </button>
          )}
        </div>

        {!hasActiveVideo && (
          <div className="absolute inset-0 flex flex-col items-center justify-center gap-3 bg-gradient-to-b from-slate-800/60 to-slate-950/90 p-4">
            <Avatar
              className={cn(
                "border-2 border-white/30 shadow-2xl",
                isSingleRemote
                  ? "h-24 w-24 sm:h-28 sm:w-28"
                  : "h-14 w-14 sm:h-16 sm:w-16",
              )}
            >
              <AvatarImage src={avatar || undefined} alt={name} />
              <AvatarFallback className="bg-indigo-600 text-white text-xl font-bold">
                {(name || "U").substring(0, 2).toUpperCase()}
              </AvatarFallback>
            </Avatar>
            {isSingleRemote && (
              <div className="text-center">
                <h4 className="text-base sm:text-lg font-bold text-white">
                  {name}
                </h4>
                <p className="text-xs text-white/60 mt-0.5">
                  {connectingLabel}
                </p>
              </div>
            )}
          </div>
        )}

        {/* Thanh thông tin thành viên ở góc dưới */}
        <div className="absolute bottom-3 left-3 right-3 flex items-center justify-between pointer-events-none z-10">
          <div className="flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-black/55 backdrop-blur-md border border-white/10 text-xs font-medium text-white max-w-[80%]">
            <span className="truncate">{name}</span>
            {isScreenSharing && (
              <MonitorUp className="w-3.5 h-3.5 text-sky-400 shrink-0" />
            )}
          </div>

          {isAudioMuted && (
            <div className="p-1.5 rounded-full bg-red-500/90 text-white shadow-sm">
              <MicOff className="w-3.5 h-3.5" />
            </div>
          )}
        </div>
      </div>
    );
  },
);

RemotePeerTile.displayName = "RemotePeerTile";

export function CallModal() {
  const t = useTranslations("Chat.Detail.call");
  const tHeader = useTranslations("Chat.Detail.header");
  const { activeCall, setActiveCall, updateActiveCall, conversations } =
    useChatStore();
  const authUser = useAuthStore((s) => s.currentAccount?.user);

  // Quản lý tập trung toàn bộ trạng thái WebRTC Runtime qua ICallRuntimeContext
  const [rtc] = useState<ICallRuntimeContext>(createCallRuntimeContext);

  const [remoteStreams, setRemoteStreams] = useState<
    Record<string, MediaStream>
  >({});
  const [isAudioMuted, setIsAudioMuted] = useState(false);
  const [isVideoOff, setIsVideoOff] = useState(false);
  const [isScreenSharing, setIsScreenSharing] = useState(false);
  const [durationSec, setDurationSec] = useState(0);
  const [isHandRaised, setIsHandRaised] = useState(false);
  const [pinnedPeerId, setPinnedPeerId] = useState<string | null>(null);
  const [showParticipantsPanel, setShowParticipantsPanel] = useState(false);
  const [ringingTargets, setRingingTargets] = useState<Record<string, boolean>>(
    {},
  );

  const isMeHost = activeCall?.initiatorId === authUser?.id;

  const effectivePinnedPeerId = useMemo(() => {
    if (pinnedPeerId && activeCall?.participants?.[pinnedPeerId]) {
      return pinnedPeerId;
    }
    const screenSharer = Object.values(activeCall?.participants || {}).find(
      (p) => p.isScreenSharing && p.userId !== authUser?.id,
    );
    return screenSharer?.userId || null;
  }, [pinnedPeerId, activeCall?.participants, authUser?.id]);

  // Adaptive Video Constraint: Tự động điều chỉnh độ phân giải/FPS theo quy mô phòng gọi
  const getAdaptiveVideoConstraints = useCallback(() => {
    const peerCount = Object.keys(activeCall?.participants || {}).length;
    if (peerCount >= 5) {
      return {
        width: { ideal: 640 },
        height: { ideal: 360 },
        frameRate: { max: 18 },
      };
    }
    if (peerCount >= 3) {
      return {
        width: { ideal: 854 },
        height: { ideal: 480 },
        frameRate: { max: 24 },
      };
    }
    return {
      width: { ideal: 1280 },
      height: { ideal: 720 },
      frameRate: { max: 30 },
    };
  }, [activeCall?.participants]);

  const bindLocalVideoElement = useCallback(
    (node: HTMLVideoElement | null) => {
      rtc.localVideoEl = node;
      if (node) {
        const activeLocal = rtc.screenStream || rtc.localStream;
        if (activeLocal && node.srcObject !== activeLocal) {
          node.srcObject = activeLocal;
        }
      }
    },
    [rtc],
  );

  const toggleRaiseHand = () => {
    if (!activeCall) return;
    const nextRaised = !isHandRaised;
    setIsHandRaised(nextRaised);
    socketService.send(
      SocketNamespaceEnum.CHAT,
      SOCKET_EVENTS.CALL.MEDIA_STATE,
      {
        callId: activeCall.callId,
        isHandRaised: nextRaised,
      },
    );
  };

  const handleHostMuteMember = (targetUserId: string) => {
    if (!activeCall || !isMeHost) return;
    socketService.send(SocketNamespaceEnum.CHAT, SOCKET_EVENTS.CALL.HOST_MUTE, {
      callId: activeCall.callId,
      targetUserId,
    });
  };

  const handleTogglePinPeer = useCallback((userId: string) => {
    setPinnedPeerId((prev) => (prev === userId ? null : userId));
  }, []);

  const handleRingGroupMember = (targetUserId: string) => {
    if (!activeCall) return;
    setRingingTargets((prev) => ({ ...prev, [targetUserId]: true }));
    socketService.send(SocketNamespaceEnum.CHAT, SOCKET_EVENTS.CALL.RING_USER, {
      callId: activeCall.callId,
      targetUserId,
    });
    toast.success(t("ringSentToast"));
    setTimeout(() => {
      setRingingTargets((prev) => ({ ...prev, [targetUserId]: false }));
    }, 5000);
  };

  const conversation = useMemo(
    () => conversations.find((c) => c.id === activeCall?.conversationId),
    [conversations, activeCall?.conversationId],
  );

  const isGroupCall = Boolean(
    activeCall?.isGroupCall ||
      conversation?.type === ConversationTypeEnum.GROUP ||
      Object.keys(activeCall?.participants || {}).length > 2,
  );

  const getMemberMeta = useCallback(
    (userId: string) => {
      const found = activeCall?.membersInfo?.find((m) => m.id === userId);
      if (found) return found;
      if (userId === activeCall?.initiatorId && activeCall?.callerName) {
        return {
          id: userId,
          name: activeCall.callerName,
          avatar: activeCall.callerAvatar || null,
        };
      }
      if (!isGroupCall && conversation) {
        return {
          id: userId,
          name: conversation.name || tHeader("defaultUser"),
          avatar: conversation.avatar || null,
        };
      }
      return {
        id: userId,
        name: t("memberDefault"),
        avatar: null,
      };
    },
    [activeCall, conversation, isGroupCall, t, tHeader],
  );

  const fetchIceServers = useCallback(async (): Promise<RTCIceServer[]> => {
    if (rtc.iceServersCache) return rtc.iceServersCache;
    const fallback: RTCIceServer[] = [
      { urls: "stun:stun.l.google.com:19302" },
      { urls: "stun:stun1.l.google.com:19302" },
    ];
    try {
      const res = await getIceServersApi();
      if (res?.data?.iceServers) {
        rtc.iceServersCache = res.data.iceServers;
        return res.data.iceServers;
      }
    } catch {
      // Fallback to default STUN
    }
    return fallback;
  }, [rtc]);

  const ensureLocalMediaStream = useCallback(
    async (withVideo: boolean) => {
      if (rtc.localStream) {
        return rtc.localStream;
      }

      try {
        const videoConstraints = getAdaptiveVideoConstraints();
        const mediaStream = await navigator.mediaDevices.getUserMedia({
          audio: {
            echoCancellation: true,
            noiseSuppression: true,
            autoGainControl: true,
          },
          video: withVideo
            ? {
                ...videoConstraints,
                facingMode: "user",
              }
            : false,
        });
        rtc.localStream = mediaStream;
        setIsVideoOff(!withVideo);

        if (rtc.localVideoEl) {
          rtc.localVideoEl.srcObject = mediaStream;
        }
        return mediaStream;
      } catch (err) {
        if (withVideo) {
          const audioOnlyStream = await navigator.mediaDevices.getUserMedia({
            audio: true,
            video: false,
          });
          rtc.localStream = audioOnlyStream;
          setIsVideoOff(true);
          toast.info(t("noCameraFallback"));
          return audioOnlyStream;
        }
        throw err;
      }
    },
    [getAdaptiveVideoConstraints, rtc, t],
  );

  const flushPendingCandidates = useCallback(
    async (targetUserId: string, pc: RTCPeerConnection) => {
      if (!pc.remoteDescription) return;
      const queue = rtc.pendingCandidates.get(targetUserId) || [];
      if (queue.length === 0) return;

      rtc.pendingCandidates.delete(targetUserId);
      for (const candidate of queue) {
        try {
          await pc.addIceCandidate(new RTCIceCandidate(candidate));
        } catch (err) {
          console.warn("ICE candidate flush warning:", err);
        }
      }
    },
    [rtc],
  );

  const removePeerConnection = useCallback(
    (targetUserId: string) => {
      const pc = rtc.peers.get(targetUserId);
      if (pc) {
        pc.onicecandidate = null;
        pc.ontrack = null;
        pc.onconnectionstatechange = null;
        pc.oniceconnectionstatechange = null;
        pc.close();
        rtc.peers.delete(targetUserId);
      }
      rtc.pendingCandidates.delete(targetUserId);
      rtc.initiatedOffers.delete(targetUserId);
      rtc.makingOffer.delete(targetUserId);
      rtc.ignoreOffer.delete(targetUserId);
      setRemoteStreams((prev) => {
        const next = { ...prev };
        delete next[targetUserId];
        return next;
      });
    },
    [rtc],
  );

  const cleanupAllMediaAndPeers = useCallback(() => {
    if (rtc.localStream) {
      rtc.localStream.getTracks().forEach((track) => track.stop());
      rtc.localStream = null;
    }
    if (rtc.screenStream) {
      rtc.screenStream.getTracks().forEach((track) => track.stop());
      rtc.screenStream = null;
    }
    rtc.peers.forEach((pc) => {
      pc.onicecandidate = null;
      pc.ontrack = null;
      pc.onconnectionstatechange = null;
      pc.oniceconnectionstatechange = null;
      pc.close();
    });
    rtc.peers.clear();
    rtc.pendingCandidates.clear();
    rtc.initiatedOffers.clear();
    rtc.makingOffer.clear();
    rtc.ignoreOffer.clear();
    setRemoteStreams({});
    setIsAudioMuted(false);
    setIsVideoOff(false);
    setIsScreenSharing(false);
    setDurationSec(0);
  }, [rtc]);

  const getOrCreatePeerConnection = useCallback(
    async (callId: string, targetUserId: string, isVideo: boolean) => {
      const existing = rtc.peers.get(targetUserId);
      if (existing) return existing;

      const iceServers = await fetchIceServers();
      const pc = new RTCPeerConnection({ iceServers });
      rtc.peers.set(targetUserId, pc);

      pc.onicecandidate = (event) => {
        if (event.candidate) {
          socketService.send(
            SocketNamespaceEnum.CHAT,
            SOCKET_EVENTS.CALL.SIGNAL,
            {
              callId,
              targetUserId,
              type: "ice-candidate",
              signalData: event.candidate.toJSON(),
            },
          );
        }
      };

      // Tự động phục hồi kết nối (ICE Restart) khi mạng chập chờn
      pc.oniceconnectionstatechange = async () => {
        if (pc.iceConnectionState === "failed") {
          const isPolite = (authUser?.id || "") < targetUserId;
          if (!isPolite) {
            try {
              pc.restartIce();
              rtc.makingOffer.set(targetUserId, true);
              const offer = await pc.createOffer({ iceRestart: true });
              await pc.setLocalDescription(offer);
              socketService.send(
                SocketNamespaceEnum.CHAT,
                SOCKET_EVENTS.CALL.SIGNAL,
                {
                  callId,
                  targetUserId,
                  type: "renegotiate",
                  signalData: pc.localDescription,
                },
              );
            } catch (err) {
              console.warn("ICE restart failed:", err);
            } finally {
              rtc.makingOffer.set(targetUserId, false);
            }
          }
        }
      };

      pc.ontrack = (event) => {
        const stream = event.streams?.[0];
        if (stream) {
          setRemoteStreams((prev) => ({
            ...prev,
            [targetUserId]: stream,
          }));
        }
      };

      const mediaStream = await ensureLocalMediaStream(isVideo);
      mediaStream.getTracks().forEach((track) => {
        pc.addTrack(track, mediaStream);
      });

      return pc;
    },
    [authUser?.id, ensureLocalMediaStream, fetchIceServers, rtc],
  );

  useEffect(() => {
    if (rtc.localVideoEl) {
      const activeLocal = rtc.screenStream || rtc.localStream;
      if (activeLocal && rtc.localVideoEl.srcObject !== activeLocal) {
        rtc.localVideoEl.srcObject = activeLocal;
      }
    }
  }, [activeCall?.isMinimized, isVideoOff, isScreenSharing, rtc]);

  const activeCallId = activeCall?.callId;

  useEffect(() => {
    if (!activeCallId) {
      cleanupAllMediaAndPeers();
      return;
    }

    const cleanSignal = socketService.on<any>(
      SocketNamespaceEnum.CHAT,
      SOCKET_EVENTS.CALL.SIGNAL,
      async (payload) => {
        const latestCall = useChatStore.getState().activeCall;
        if (!latestCall || payload.callId !== latestCall.callId) return;
        const fromUserId = payload.fromUserId as string;
        if (!fromUserId || fromUserId === authUser?.id) return;

        try {
          if (payload.type === "offer" || payload.type === "renegotiate") {
            const pc = await getOrCreatePeerConnection(
              latestCall.callId,
              fromUserId,
              latestCall.callType === CallTypeEnum.VIDEO,
            );

            // W3C Perfect Negotiation: Giải quyết xung đột Offer (Glare Condition)
            const isPolite = (authUser?.id || "") < fromUserId;
            const isMakingOffer = Boolean(rtc.makingOffer.get(fromUserId));
            const offerCollision =
              isMakingOffer || pc.signalingState !== "stable";

            const shouldIgnore = !isPolite && offerCollision;
            rtc.ignoreOffer.set(fromUserId, shouldIgnore);
            if (shouldIgnore) {
              return;
            }

            if (offerCollision) {
              await Promise.all([
                pc.setLocalDescription({ type: "rollback" }),
                pc.setRemoteDescription(
                  new RTCSessionDescription(payload.signalData),
                ),
              ]);
            } else {
              await pc.setRemoteDescription(
                new RTCSessionDescription(payload.signalData),
              );
            }

            await flushPendingCandidates(fromUserId, pc);
            const answer = await pc.createAnswer();
            await pc.setLocalDescription(answer);
            socketService.send(
              SocketNamespaceEnum.CHAT,
              SOCKET_EVENTS.CALL.SIGNAL,
              {
                callId: latestCall.callId,
                targetUserId: fromUserId,
                type: "answer",
                signalData: pc.localDescription,
              },
            );
          } else if (payload.type === "answer") {
            if (rtc.ignoreOffer.get(fromUserId)) return;
            const pc = rtc.peers.get(fromUserId);
            if (!pc || pc.signalingState !== "have-local-offer") return;
            await pc.setRemoteDescription(
              new RTCSessionDescription(payload.signalData),
            );
            await flushPendingCandidates(fromUserId, pc);
          } else if (payload.type === "ice-candidate" && payload.signalData) {
            if (rtc.ignoreOffer.get(fromUserId)) return;
            const pc = rtc.peers.get(fromUserId);
            if (pc && pc.remoteDescription && pc.remoteDescription.type) {
              await pc.addIceCandidate(new RTCIceCandidate(payload.signalData));
            } else {
              const list = rtc.pendingCandidates.get(fromUserId) || [];
              list.push(payload.signalData);
              rtc.pendingCandidates.set(fromUserId, list);
            }
          }
        } catch (err) {
          console.error("WebRTC signal error:", err);
        }
      },
    );

    const cleanParticipantJoined = socketService.on<any>(
      SocketNamespaceEnum.CHAT,
      SOCKET_EVENTS.CALL.PARTICIPANT_JOINED,
      async (payload) => {
        const latestCall = useChatStore.getState().activeCall;
        if (!latestCall || payload.callId !== latestCall.callId) return;

        updateActiveCall({
          participants: payload.participants || {},
          membersInfo: payload.membersInfo || latestCall.membersInfo,
        });

        const joinedUserId = payload.userId as string;
        if (
          joinedUserId &&
          joinedUserId !== authUser?.id &&
          !rtc.initiatedOffers.has(joinedUserId)
        ) {
          rtc.initiatedOffers.add(joinedUserId);
          try {
            rtc.makingOffer.set(joinedUserId, true);
            const pc = await getOrCreatePeerConnection(
              latestCall.callId,
              joinedUserId,
              latestCall.callType === CallTypeEnum.VIDEO,
            );
            const offer = await pc.createOffer();
            await pc.setLocalDescription(offer);
            socketService.send(
              SocketNamespaceEnum.CHAT,
              SOCKET_EVENTS.CALL.SIGNAL,
              {
                callId: latestCall.callId,
                targetUserId: joinedUserId,
                type: "offer",
                signalData: pc.localDescription,
              },
            );
          } catch (err) {
            console.error("Mesh offer error:", err);
          } finally {
            rtc.makingOffer.set(joinedUserId, false);
          }
        }
      },
    );

    const cleanParticipantLeft = socketService.on<any>(
      SocketNamespaceEnum.CHAT,
      SOCKET_EVENTS.CALL.PARTICIPANT_LEFT,
      (payload) => {
        const latestCall = useChatStore.getState().activeCall;
        if (!latestCall || payload.callId !== latestCall.callId) return;
        if (payload.userId) {
          removePeerConnection(payload.userId);
        }
        if (payload.remainingParticipants) {
          updateActiveCall({
            participants: payload.remainingParticipants,
          });
        }
      },
    );

    const cleanHostMutedLocal = socketService.on<{
      callId: string;
      mutedBy: string;
    }>(SocketNamespaceEnum.CHAT, SOCKET_EVENTS.CALL.HOST_MUTED, (payload) => {
      const latestCall = useChatStore.getState().activeCall;
      if (!latestCall || payload?.callId !== latestCall.callId) return;
      if (rtc.localStream) {
        rtc.localStream.getAudioTracks().forEach((track) => {
          track.enabled = false;
        });
      }
      setIsAudioMuted(true);
    });

    return () => {
      cleanSignal();
      cleanParticipantJoined();
      cleanParticipantLeft();
      cleanHostMutedLocal();
    };
  }, [
    activeCallId,
    authUser?.id,
    cleanupAllMediaAndPeers,
    flushPendingCandidates,
    getOrCreatePeerConnection,
    removePeerConnection,
    rtc,
    updateActiveCall,
  ]);

  useEffect(() => {
    if (!activeCall || activeCall.isIncoming) return;
    if (activeCall.status !== CallStatusEnum.ONGOING) return;

    const partnerIds = Object.keys(activeCall.participants || {}).filter(
      (id) => id !== authUser?.id,
    );
    if (partnerIds.length === 0 && conversation?.partnerId) {
      partnerIds.push(conversation.partnerId);
    }

    partnerIds.forEach((targetId) => {
      if (!targetId || rtc.initiatedOffers.has(targetId)) return;
      rtc.initiatedOffers.add(targetId);

      (async () => {
        try {
          rtc.makingOffer.set(targetId, true);
          const pc = await getOrCreatePeerConnection(
            activeCall.callId,
            targetId,
            activeCall.callType === CallTypeEnum.VIDEO,
          );
          const offer = await pc.createOffer();
          await pc.setLocalDescription(offer);
          socketService.send(
            SocketNamespaceEnum.CHAT,
            SOCKET_EVENTS.CALL.SIGNAL,
            {
              callId: activeCall.callId,
              targetUserId: targetId,
              type: "offer",
              signalData: pc.localDescription || offer,
            },
          );
        } catch (err: any) {
          toast.error(err?.message || t("mediaError"));
        } finally {
          rtc.makingOffer.set(targetId, false);
        }
      })();
    });
  }, [
    activeCall,
    authUser?.id,
    conversation?.partnerId,
    getOrCreatePeerConnection,
    rtc,
    t,
  ]);

  useEffect(() => {
    if (!activeCall || activeCall.status !== CallStatusEnum.ONGOING) return;
    const timer = setInterval(() => {
      setDurationSec((s) => s + 1);
    }, 1000);
    return () => clearInterval(timer);
  }, [activeCall?.status]);

  useEffect(() => {
    const handleBeforeUnload = () => {
      if (activeCall) {
        socketService.send(
          SocketNamespaceEnum.CHAT,
          SOCKET_EVENTS.CALL.HANGUP,
          { callId: activeCall.callId },
        );
        cleanupAllMediaAndPeers();
      }
    };
    window.addEventListener("beforeunload", handleBeforeUnload);
    return () => window.removeEventListener("beforeunload", handleBeforeUnload);
  }, [activeCall, cleanupAllMediaAndPeers]);

  if (!activeCall) return null;

  const formatTimer = (sec: number) => {
    const hrs = Math.floor(sec / 3600);
    const mins = Math.floor((sec % 3600) / 60)
      .toString()
      .padStart(2, "0");
    const rem = (sec % 60).toString().padStart(2, "0");
    return hrs > 0 ? `${hrs}:${mins}:${rem}` : `${mins}:${rem}`;
  };

  const handleAcceptCall = async () => {
    try {
      await ensureLocalMediaStream(activeCall.callType === CallTypeEnum.VIDEO);

      const res = await socketService.emit<any>(
        SocketNamespaceEnum.CHAT,
        SOCKET_EVENTS.CALL.ACCEPT,
        { callId: activeCall.callId },
      );

      if (activeCall.sdpOffer && activeCall.initiatorId) {
        const pc = await getOrCreatePeerConnection(
          activeCall.callId,
          activeCall.initiatorId,
          activeCall.callType === CallTypeEnum.VIDEO,
        );
        await pc.setRemoteDescription(
          new RTCSessionDescription(activeCall.sdpOffer),
        );
        await flushPendingCandidates(activeCall.initiatorId, pc);
        const answer = await pc.createAnswer();
        await pc.setLocalDescription(answer);
        socketService.send(
          SocketNamespaceEnum.CHAT,
          SOCKET_EVENTS.CALL.SIGNAL,
          {
            callId: activeCall.callId,
            targetUserId: activeCall.initiatorId,
            type: "answer",
            signalData: answer,
          },
        );
      }

      updateActiveCall({
        status: CallStatusEnum.ONGOING,
        isIncoming: false,
        participants: res?.session?.participants || activeCall.participants,
        membersInfo: res?.membersInfo || activeCall.membersInfo,
      });
    } catch (err: any) {
      toast.error(err?.message || t("acceptError"));
    }
  };

  const handleRejectCall = async () => {
    try {
      await socketService.emit(
        SocketNamespaceEnum.CHAT,
        SOCKET_EVENTS.CALL.REJECT,
        { callId: activeCall.callId, reason: "declined" },
      );
    } finally {
      cleanupAllMediaAndPeers();
      setActiveCall(null);
    }
  };

  const handleHangup = async (endForAll = false) => {
    try {
      await socketService.emit(
        SocketNamespaceEnum.CHAT,
        SOCKET_EVENTS.CALL.HANGUP,
        { callId: activeCall.callId, endForAll },
      );
    } finally {
      cleanupAllMediaAndPeers();
      setActiveCall(null);
    }
  };

  const toggleAudio = () => {
    const stream = rtc.localStream;
    if (!stream) return;
    const nextMuted = !isAudioMuted;
    stream.getAudioTracks().forEach((t) => {
      t.enabled = !nextMuted;
    });
    setIsAudioMuted(nextMuted);
    socketService.send(
      SocketNamespaceEnum.CHAT,
      SOCKET_EVENTS.CALL.MEDIA_STATE,
      {
        callId: activeCall.callId,
        isAudioMuted: nextMuted,
      },
    );
  };

  const toggleVideo = async () => {
    const stream = rtc.localStream;
    if (!stream) return;

    const existingVideoTracks = stream.getVideoTracks();

    if (existingVideoTracks.length === 0) {
      try {
        const videoConstraints = getAdaptiveVideoConstraints();
        const camStream = await navigator.mediaDevices.getUserMedia({
          video: videoConstraints,
        });
        const newVideoTrack = camStream.getVideoTracks()[0];
        if (!newVideoTrack) return;

        stream.addTrack(newVideoTrack);
        if (rtc.localVideoEl) {
          rtc.localVideoEl.srcObject = stream;
        }

        for (const [targetUserId, pc] of rtc.peers.entries()) {
          pc.addTrack(newVideoTrack, stream);
          const offer = await pc.createOffer();
          await pc.setLocalDescription(offer);
          socketService.send(
            SocketNamespaceEnum.CHAT,
            SOCKET_EVENTS.CALL.SIGNAL,
            {
              callId: activeCall.callId,
              targetUserId,
              type: "renegotiate",
              signalData: offer,
            },
          );
        }

        setIsVideoOff(false);
        updateActiveCall({ callType: CallTypeEnum.VIDEO });
        socketService.send(
          SocketNamespaceEnum.CHAT,
          SOCKET_EVENTS.CALL.MEDIA_STATE,
          {
            callId: activeCall.callId,
            isVideoOff: false,
          },
        );
      } catch {
        toast.error(t("cameraToggleError"));
      }
      return;
    }

    const nextOff = !isVideoOff;
    existingVideoTracks.forEach((t) => {
      t.enabled = !nextOff;
    });
    setIsVideoOff(nextOff);
    socketService.send(
      SocketNamespaceEnum.CHAT,
      SOCKET_EVENTS.CALL.MEDIA_STATE,
      {
        callId: activeCall.callId,
        isVideoOff: nextOff,
      },
    );
  };

  const toggleScreenShare = async () => {
    try {
      if (!isScreenSharing) {
        const displayStream = await navigator.mediaDevices.getDisplayMedia({
          video: true,
        });
        rtc.screenStream = displayStream;
        const screenTrack = displayStream.getVideoTracks()[0];

        for (const [targetUserId, pc] of rtc.peers.entries()) {
          const sender = pc.getSenders().find((s) => s.track?.kind === "video");
          if (sender) {
            await sender.replaceTrack(screenTrack);
          } else {
            pc.addTrack(screenTrack, displayStream);
            const offer = await pc.createOffer();
            await pc.setLocalDescription(offer);
            socketService.send(
              SocketNamespaceEnum.CHAT,
              SOCKET_EVENTS.CALL.SIGNAL,
              {
                callId: activeCall.callId,
                targetUserId,
                type: "renegotiate",
                signalData: offer,
              },
            );
          }
        }

        if (rtc.localVideoEl) {
          rtc.localVideoEl.srcObject = displayStream;
        }
        setIsScreenSharing(true);
        updateActiveCall({ callType: CallTypeEnum.VIDEO });
        socketService.send(
          SocketNamespaceEnum.CHAT,
          SOCKET_EVENTS.CALL.MEDIA_STATE,
          {
            callId: activeCall.callId,
            isScreenSharing: true,
            isVideoOff: false,
          },
        );

        screenTrack.onended = () => {
          stopScreenShare();
        };
      } else {
        await stopScreenShare();
      }
    } catch {}
  };

  const stopScreenShare = async () => {
    if (rtc.screenStream) {
      rtc.screenStream.getTracks().forEach((t) => t.stop());
      rtc.screenStream = null;
    }
    const camTrack = rtc.localStream?.getVideoTracks()[0] || null;
    for (const pc of rtc.peers.values()) {
      const sender = pc.getSenders().find((s) => s.track?.kind === "video");
      if (sender && camTrack) {
        await sender.replaceTrack(camTrack);
      }
    }
    if (rtc.localVideoEl && rtc.localStream) {
      rtc.localVideoEl.srcObject = rtc.localStream;
    }
    setIsScreenSharing(false);
    socketService.send(
      SocketNamespaceEnum.CHAT,
      SOCKET_EVENTS.CALL.MEDIA_STATE,
      {
        callId: activeCall.callId,
        isScreenSharing: false,
      },
    );
  };

  const remoteParticipantIds = Object.keys(
    activeCall.participants || {},
  ).filter((id) => id !== authUser?.id);

  const displayTitle =
    conversation?.name || activeCall.callerName || t("defaultTitle");
  const displayAvatar = conversation?.avatar || activeCall.callerAvatar;

  const getIncomingText = () => {
    const isVideo = activeCall.callType === CallTypeEnum.VIDEO;
    if (isGroupCall) {
      return isVideo ? t("incomingGroupVideo") : t("incomingGroupAudio");
    }
    return isVideo ? t("incomingVideo") : t("incomingAudio");
  };

  if (activeCall.isMinimized) {
    return (
      <div className="fixed top-20 right-3 md:right-6 z-50 w-[calc(100vw-1.5rem)] max-w-80 animate-in fade-in slide-in-from-bottom-3">
        <LiquidGlassModal className="p-3.5 flex items-center justify-between gap-3 border border-white/30 shadow-2xl">
          <div className="flex items-center gap-3 min-w-0">
            <GlassAvatar
              src={displayAvatar}
              name={displayTitle}
              size="md"
              isOnline
              showStatus
            />
            <div className="flex flex-col min-w-0">
              <span className="text-xs font-semibold truncate">
                {displayTitle}
              </span>
              <span className="text-[11px] text-emerald-500 font-mono font-medium">
                {activeCall.status === CallStatusEnum.ONGOING
                  ? formatTimer(durationSec)
                  : t("ringing")}
              </span>
            </div>
          </div>
          <div className="flex items-center gap-1.5 shrink-0">
            <PatternButton
              size="icon"
              variant={isAudioMuted ? "solid" : "ghost"}
              rounded="full"
              className="h-8 w-8"
              onClick={toggleAudio}
            >
              {isAudioMuted ? (
                <MicOff className="h-3.5 w-3.5" />
              ) : (
                <Mic className="h-3.5 w-3.5" />
              )}
            </PatternButton>
            <PatternButton
              size="icon"
              variant="ghost"
              rounded="full"
              className="h-8 w-8"
              onClick={() => updateActiveCall({ isMinimized: false })}
            >
              <Maximize2 className="h-4 w-4" />
            </PatternButton>
            <PatternButton
              size="icon"
              variant="solid"
              color="danger"
              rounded="full"
              className="h-8 w-8"
              onClick={() => handleHangup(false)}
            >
              <PhoneOff className="h-4 w-4" />
            </PatternButton>
          </div>
        </LiquidGlassModal>
      </div>
    );
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 backdrop-blur-md p-2 sm:p-4 md:p-6 animate-in fade-in duration-200">
      <LiquidGlassModal
        className="w-full max-w-4xl overflow-hidden border border-white/25 shadow-2xl"
        rounded="3xl"
      >
        <div className="relative flex flex-col h-[86dvh] sm:h-[82dvh] max-h-[680px] min-h-[420px] w-full bg-gradient-to-br from-slate-900 via-indigo-950/90 to-slate-900 text-white">
          <div className="flex items-center justify-between px-4 sm:px-6 py-3.5 sm:py-4 z-20">
            <div className="flex items-center gap-2.5">
              <div className="flex items-center gap-1.5 text-xs text-emerald-400 bg-emerald-500/15 border border-emerald-400/25 px-2 py-1 rounded-full backdrop-blur-md">
                <ShieldCheck className="w-3.5 h-3.5" />
              </div>

              {isGroupCall && (
                <button
                  type="button"
                  onClick={() => setShowParticipantsPanel((v) => !v)}
                  className="flex items-center gap-1.5 text-xs text-indigo-200 bg-indigo-500/20 hover:bg-indigo-500/35 border border-indigo-400/30 px-3 py-1 rounded-full transition-colors cursor-pointer"
                >
                  <Users className="w-3.5 h-3.5" />
                  <span>
                    {t("membersCount", {
                      count: Object.keys(activeCall.participants || {}).length,
                    })}
                  </span>
                </button>
              )}
            </div>

            <div className="flex items-center gap-2.5 sm:gap-3">
              {activeCall.status === CallStatusEnum.ONGOING && (
                <>
                  <span className="inline-flex items-center gap-1.5 text-xs font-mono bg-white/10 px-3 py-1 rounded-full border border-white/15">
                    <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
                    {formatTimer(durationSec)}
                  </span>
                  <PatternButton
                    size="icon"
                    variant="glass"
                    rounded="full"
                    className="h-8 w-8"
                    onClick={() => updateActiveCall({ isMinimized: true })}
                    title={t("minimizeTitle")}
                  >
                    <Minimize2 className="w-4 h-4" />
                  </PatternButton>
                </>
              )}
            </div>
          </div>

          {/* Khu vực hiển thị Video / Avatar / Spotlight */}
          <div className="relative flex-1 min-h-0 flex flex-col items-center justify-center overflow-hidden px-3 sm:px-6">
            {activeCall.status === CallStatusEnum.RINGING ? (
              <div className="relative z-10 flex flex-col items-center gap-5">
                <div className="relative">
                  <div className="absolute -inset-4 rounded-full bg-indigo-500/25 animate-ping" />
                  <div className="absolute -inset-8 rounded-full bg-indigo-500/10 animate-pulse" />
                  <Avatar className="h-24 w-24 sm:h-28 sm:w-28 border-2 border-white/40 shadow-2xl">
                    <AvatarImage src={displayAvatar || undefined} />
                    <AvatarFallback className="bg-indigo-600 text-white text-2xl font-bold">
                      {displayTitle.substring(0, 2).toUpperCase()}
                    </AvatarFallback>
                  </Avatar>
                </div>

                <div className="text-center space-y-1.5 px-4">
                  <h3 className="text-lg sm:text-xl font-bold tracking-tight">
                    {displayTitle}
                  </h3>
                  <p className="text-xs sm:text-sm text-white/75">
                    {activeCall.isIncoming ? getIncomingText() : t("ringing")}
                  </p>
                </div>
              </div>
            ) : remoteParticipantIds.length <= 1 ? (
              <div className="w-full h-full rounded-2xl overflow-hidden relative flex items-center justify-center">
                {remoteParticipantIds.map((pid) => {
                  const meta = getMemberMeta(pid);
                  const pState = activeCall.participants?.[pid];
                  return (
                    <RemotePeerTile
                      key={pid}
                      userId={pid}
                      name={meta.name}
                      avatar={meta.avatar}
                      stream={remoteStreams[pid]}
                      isAudioMuted={pState?.isAudioMuted}
                      isVideoOff={
                        pState?.isVideoOff ??
                        activeCall.callType === CallTypeEnum.AUDIO
                      }
                      isScreenSharing={pState?.isScreenSharing}
                      isHandRaised={pState?.isHandRaised}
                      isPinned={effectivePinnedPeerId === pid}
                      isHost={isMeHost}
                      isSingleRemote
                      connectingLabel={t("connectingAudio")}
                      onTogglePin={handleTogglePinPeer}
                      onHostMute={handleHostMuteMember}
                    />
                  );
                })}
              </div>
            ) : effectivePinnedPeerId &&
              remoteParticipantIds.includes(effectivePinnedPeerId) ? (
              <div className="flex flex-col md:flex-row gap-3 w-full h-full min-h-0 py-1">
                <div className="flex-1 min-h-0 h-full rounded-2xl overflow-hidden">
                  {(() => {
                    const pid = effectivePinnedPeerId;
                    const meta = getMemberMeta(pid);
                    const pState = activeCall.participants?.[pid];
                    return (
                      <RemotePeerTile
                        key={pid}
                        userId={pid}
                        name={meta.name}
                        avatar={meta.avatar}
                        stream={remoteStreams[pid]}
                        isAudioMuted={pState?.isAudioMuted}
                        isVideoOff={
                          pState?.isVideoOff ??
                          activeCall.callType === CallTypeEnum.AUDIO
                        }
                        isScreenSharing={pState?.isScreenSharing}
                        isHandRaised={pState?.isHandRaised}
                        isPinned
                        isHost={isMeHost}
                        connectingLabel={t("connectingAudio")}
                        onTogglePin={handleTogglePinPeer}
                        onHostMute={handleHostMuteMember}
                      />
                    );
                  })()}
                </div>

                <ScrollArea className="w-full md:w-56 h-32 md:h-full shrink-0">
                  <div className="flex md:flex-col gap-2.5 pr-1">
                    {remoteParticipantIds
                      .filter((pid) => pid !== effectivePinnedPeerId)
                      .map((pid) => {
                        const meta = getMemberMeta(pid);
                        const pState = activeCall.participants?.[pid];
                        return (
                          <div
                            key={pid}
                            className="w-40 md:w-full h-28 md:h-36 shrink-0"
                          >
                            <RemotePeerTile
                              userId={pid}
                              name={meta.name}
                              avatar={meta.avatar}
                              stream={remoteStreams[pid]}
                              isAudioMuted={pState?.isAudioMuted}
                              isVideoOff={
                                pState?.isVideoOff ??
                                activeCall.callType === CallTypeEnum.AUDIO
                              }
                              isScreenSharing={pState?.isScreenSharing}
                              isHandRaised={pState?.isHandRaised}
                              isPinned={false}
                              isHost={isMeHost}
                              connectingLabel={t("connectingAudio")}
                              onTogglePin={handleTogglePinPeer}
                              onHostMute={handleHostMuteMember}
                            />
                          </div>
                        );
                      })}
                  </div>
                </ScrollArea>
              </div>
            ) : (
              <ScrollArea className="w-full h-full py-1">
                <div
                  className={cn(
                    "grid gap-2.5 sm:gap-3 w-full min-h-full",
                    remoteParticipantIds.length === 2
                      ? "grid-cols-1 md:grid-cols-2"
                      : remoteParticipantIds.length <= 4
                        ? "grid-cols-2"
                        : "grid-cols-2 md:grid-cols-3",
                  )}
                >
                  {remoteParticipantIds.map((pid) => {
                    const meta = getMemberMeta(pid);
                    const pState = activeCall.participants?.[pid];
                    return (
                      <RemotePeerTile
                        key={pid}
                        userId={pid}
                        name={meta.name}
                        avatar={meta.avatar}
                        stream={remoteStreams[pid]}
                        isAudioMuted={pState?.isAudioMuted}
                        isVideoOff={
                          pState?.isVideoOff ??
                          activeCall.callType === CallTypeEnum.AUDIO
                        }
                        isScreenSharing={pState?.isScreenSharing}
                        isHandRaised={pState?.isHandRaised}
                        isPinned={effectivePinnedPeerId === pid}
                        isHost={isMeHost}
                        connectingLabel={t("connectingAudio")}
                        onTogglePin={handleTogglePinPeer}
                        onHostMute={handleHostMuteMember}
                      />
                    );
                  })}
                </div>
              </ScrollArea>
            )}

            {/* Ngăn kéo quản lý thành viên & Gọi lại (Ring User) trong Cuộc gọi nhóm */}
            {isGroupCall && showParticipantsPanel && (
              <div className="absolute top-2 right-3 sm:right-6 z-30 w-72 max-w-[calc(100vw-2rem)] rounded-2xl bg-slate-900/95 backdrop-blur-xl border border-white/20 p-3 shadow-2xl animate-in fade-in slide-in-from-right-3 duration-200">
                <div className="flex items-center justify-between border-b border-white/15 pb-2 mb-2">
                  <span className="text-xs font-bold flex items-center gap-1.5">
                    <Users className="w-3.5 h-3.5 text-indigo-400" />
                    {t("participantsListTitle")}
                  </span>
                  <button
                    type="button"
                    onClick={() => setShowParticipantsPanel(false)}
                    className="text-xs text-white/60 hover:text-white cursor-pointer"
                  >
                    ✕
                  </button>
                </div>

                <ScrollArea className="h-56 pr-1">
                  <div className="space-y-1.5">
                    {(activeCall.membersInfo || []).map((member) => {
                      const inCallState = activeCall.participants?.[member.id];
                      const isJoined = Boolean(inCallState);
                      const isMeMember = member.id === authUser?.id;

                      return (
                        <div
                          key={member.id}
                          className="flex items-center justify-between gap-2 p-1.5 rounded-xl bg-white/5 border border-white/10"
                        >
                          <div className="flex items-center gap-2 min-w-0">
                            <GlassAvatar
                              src={member.avatar}
                              name={member.name}
                              size="xs"
                              isOnline={isJoined}
                              showStatus={isJoined}
                            />
                            <div className="min-w-0">
                              <p className="text-xs font-medium text-white truncate">
                                {member.name} {isMeMember ? `(${t("you")})` : ""}
                              </p>
                              <p className="text-[10px] text-white/60">
                                {isJoined
                                  ? t("inCallStatus")
                                  : t("notJoinedStatus")}
                              </p>
                            </div>
                          </div>

                          {isJoined ? (
                            <div className="flex items-center gap-1 shrink-0">
                              {inCallState?.isHandRaised && (
                                <Hand className="w-3.5 h-3.5 text-amber-400" />
                              )}
                              {isMeHost &&
                                !isMeMember &&
                                !inCallState?.isAudioMuted && (
                                  <button
                                    type="button"
                                    onClick={() =>
                                      handleHostMuteMember(member.id)
                                    }
                                    className="p-1 rounded-full bg-red-500/20 text-red-300 hover:bg-red-500/40 cursor-pointer"
                                    title={t("hostMuteMember")}
                                  >
                                    <MicOff className="w-3 h-3" />
                                  </button>
                                )}
                            </div>
                          ) : (
                            <PatternButton
                              size="sm"
                              variant="ghost"
                              rounded="full"
                              disabled={Boolean(ringingTargets[member.id])}
                              onClick={() => handleRingGroupMember(member.id)}
                              className="h-6 px-2 text-[10px] bg-emerald-500/20 text-emerald-300 hover:bg-emerald-500/30 shrink-0"
                              icon={<BellRing className="w-3 h-3" />}
                            >
                              {ringingTargets[member.id]
                                ? t("ringingBtn")
                                : t("ringUserBtn")}
                            </PatternButton>
                          )}
                        </div>
                      );
                    })}
                  </div>
                </ScrollArea>
              </div>
            )}

            {(activeCall.callType === CallTypeEnum.VIDEO ||
              !isVideoOff ||
              isScreenSharing) && (
              <div className="absolute bottom-3 right-3 sm:bottom-4 sm:right-6 z-20 w-28 h-20 sm:w-40 sm:h-28 rounded-2xl overflow-hidden border border-white/35 shadow-2xl bg-slate-900/80 backdrop-blur-md">
                <video
                  ref={bindLocalVideoElement}
                  autoPlay
                  muted
                  playsInline
                  className={cn(
                    "w-full h-full object-cover",
                    isVideoOff && !isScreenSharing && "hidden",
                  )}
                />
                {isVideoOff && !isScreenSharing && (
                  <div className="w-full h-full flex flex-col items-center justify-center gap-1 text-[10px] sm:text-[11px] text-white/60">
                    <VideoOff className="w-4 h-4 opacity-70" />
                    <span>{t("cameraOff")}</span>
                  </div>
                )}
                <span className="absolute bottom-1.5 left-2 text-[10px] px-2 py-0.5 rounded-full bg-black/60 text-white/90">
                  {t("you")} {isScreenSharing ? t("screenLabel") : ""}
                </span>
              </div>
            )}
          </div>

          <div className="p-3 sm:p-5 flex justify-center z-20 w-full">
            <LiquidGlass
              variant="frosted"
              blur="2xl"
              opacity="30"
              rounded="full"
              border="highlight"
              fluid={false}
              isolate={false}
              contentClassName="px-3 py-1.5 flex items-center justify-center gap-2 sm:gap-3.5"
              className="shadow-2xl max-w-full"
            >
              {activeCall.status === CallStatusEnum.RINGING &&
              activeCall.isIncoming ? (
                <>
                  <PatternButton
                    variant="solid"
                    color="success"
                    rounded="full"
                    size="icon"
                    onClick={handleAcceptCall}
                    className="h-12 w-12 sm:h-14 sm:w-14"
                  >
                    <PhoneCall className="w-5 h-5" />
                  </PatternButton>
                  <PatternButton
                    variant="solid"
                    color="danger"
                    rounded="full"
                    size="icon"
                    onClick={handleRejectCall}
                    className="h-12 w-12 sm:h-14 sm:w-14"
                  >
                    <PhoneOff className="w-5 h-5" />
                  </PatternButton>
                </>
              ) : (
                <>
                  <PatternButton
                    variant={isAudioMuted ? "solid" : "glass"}
                    size="icon"
                    rounded="full"
                    className="h-11 w-11 sm:h-12 sm:w-12"
                    onClick={toggleAudio}
                    title={isAudioMuted ? t("unmuteMic") : t("muteMic")}
                  >
                    {isAudioMuted ? (
                      <MicOff className="w-5 h-5" />
                    ) : (
                      <Mic className="w-5 h-5" />
                    )}
                  </PatternButton>

                  <PatternButton
                    variant={isVideoOff ? "solid" : "glass"}
                    size="icon"
                    rounded="full"
                    className="h-11 w-11 sm:h-12 sm:w-12"
                    onClick={toggleVideo}
                    title={isVideoOff ? t("turnOnCamera") : t("turnOffCamera")}
                  >
                    {isVideoOff ? (
                      <VideoOff className="w-5 h-5" />
                    ) : (
                      <VideoIcon className="w-5 h-5" />
                    )}
                  </PatternButton>

                  {activeCall.status === CallStatusEnum.ONGOING && (
                    <PatternButton
                      variant={isScreenSharing ? "solid" : "glass"}
                      size="icon"
                      rounded="full"
                      className="h-11 w-11 sm:h-12 sm:w-12 hidden sm:inline-flex"
                      onClick={toggleScreenShare}
                      title={
                        isScreenSharing
                          ? t("stopScreenShare")
                          : t("startScreenShare")
                      }
                    >
                      <MonitorUp className="w-5 h-5" />
                    </PatternButton>
                  )}

                  {activeCall.status === CallStatusEnum.ONGOING &&
                    isGroupCall && (
                      <>
                        <PatternButton
                          variant={isHandRaised ? "solid" : "glass"}
                          color={isHandRaised ? "warning" : "primary"}
                          size="icon"
                          rounded="full"
                          className="h-11 w-11 sm:h-12 sm:w-12"
                          onClick={toggleRaiseHand}
                          title={
                            isHandRaised ? t("lowerHand") : t("raiseHand")
                          }
                        >
                          <Hand className="w-5 h-5" />
                        </PatternButton>

                        <PatternButton
                          variant={showParticipantsPanel ? "solid" : "glass"}
                          size="icon"
                          rounded="full"
                          className="h-11 w-11 sm:h-12 sm:w-12"
                          onClick={() =>
                            setShowParticipantsPanel((prev) => !prev)
                          }
                          title={t("participantsListTitle")}
                        >
                          <UserPlus className="w-5 h-5" />
                        </PatternButton>
                      </>
                    )}

                  <PatternButton
                    variant="solid"
                    color="danger"
                    size="icon"
                    rounded="full"
                    className="h-11 w-11 sm:h-12 sm:w-12"
                    onClick={() => handleHangup(false)}
                    title={t("endCall")}
                  >
                    <PhoneOff className="w-5 h-5" />
                  </PatternButton>

                  {isGroupCall &&
                    isMeHost &&
                    activeCall.status === CallStatusEnum.ONGOING && (
                      <PatternButton
                        variant="outline"
                        color="danger"
                        size="sm"
                        rounded="full"
                        onClick={() => handleHangup(true)}
                        className="h-10 px-3 text-[11px] font-semibold border-red-400/50 text-red-200 hover:bg-red-600/30 hidden md:inline-flex"
                      >
                        {t("endCallForAll")}
                      </PatternButton>
                    )}
                </>
              )}
            </LiquidGlass>
          </div>
        </div>
      </LiquidGlassModal>
    </div>
  );
}
