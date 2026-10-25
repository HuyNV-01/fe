/** biome-ignore-all lint/a11y/useMediaCaption: <explanation> */
/** biome-ignore-all lint/correctness/useExhaustiveDependencies: <explanation> */
/** biome-ignore-all lint/suspicious/useIterableCallbackReturn: <explanation> */
"use client";

import React, {
  useCallback,
  useEffect,
  useMemo,
  useRef,
  useState,
} from "react";
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
} from "lucide-react";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import {
  LiquidGlass,
  LiquidGlassModal,
} from "@/components/liquid-glass/liquid-glass";
import { PatternButton } from "@/components/button/button-patterns";
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

interface RemotePeerTileProps {
  userId: string;
  name: string;
  avatar?: string | null;
  stream?: MediaStream;
  isAudioMuted?: boolean;
  isVideoOff?: boolean;
  isScreenSharing?: boolean;
  isSingleRemote?: boolean;
}

const RemotePeerTile = React.memo(
  ({
    name,
    avatar,
    stream,
    isAudioMuted,
    isVideoOff,
    isScreenSharing,
    isSingleRemote,
  }: RemotePeerTileProps) => {
    const videoRef = useRef<HTMLVideoElement | null>(null);

    useEffect(() => {
      if (videoRef.current && stream) {
        videoRef.current.srcObject = stream;
      }
    }, [stream]);

    const hasActiveVideo = Boolean(stream && !isVideoOff);

    return (
      <div
        className={cn(
          "relative overflow-hidden flex items-center justify-center bg-slate-900/80 border border-white/15 transition-all",
          isSingleRemote
            ? "w-full h-full rounded-none border-0"
            : "rounded-2xl h-full w-full min-h-[160px] shadow-lg",
        )}
      >
        <video
          ref={videoRef}
          autoPlay
          playsInline
          className={cn(
            "w-full h-full object-cover transition-opacity duration-300",
            hasActiveVideo ? "opacity-100" : "opacity-0 pointer-events-none",
          )}
        />

        {!hasActiveVideo && (
          <div className="absolute inset-0 flex flex-col items-center justify-center gap-3 bg-gradient-to-b from-slate-800/60 to-slate-950/90 p-4">
            <Avatar
              className={cn(
                "border-2 border-white/30 shadow-2xl",
                isSingleRemote ? "h-28 w-28" : "h-16 w-16",
              )}
            >
              <AvatarImage src={avatar || undefined} alt={name} />
              <AvatarFallback className="bg-indigo-600 text-white text-xl font-bold">
                {(name || "U").substring(0, 2).toUpperCase()}
              </AvatarFallback>
            </Avatar>
            {isSingleRemote && (
              <div className="text-center">
                <h4 className="text-lg font-bold text-white">{name}</h4>
                <p className="text-xs text-white/60 mt-0.5">
                  Đang kết nối âm thanh
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
  const { activeCall, setActiveCall, updateActiveCall, conversations } =
    useChatStore();
  const currentUser = useAuthStore((s) => s.currentAccount?.user);

  const localVideoRef = useRef<HTMLVideoElement | null>(null);
  const peersRef = useRef<Map<string, RTCPeerConnection>>(new Map());
  const localStreamRef = useRef<MediaStream | null>(null);
  const screenStreamRef = useRef<MediaStream | null>(null);
  const pendingCandidatesRef = useRef<Map<string, RTCIceCandidateInit[]>>(
    new Map(),
  );
  const iceServersCacheRef = useRef<RTCIceServer[] | null>(null);
  const initiatedOffersRef = useRef<Set<string>>(new Set());

  const [remoteStreams, setRemoteStreams] = useState<
    Record<string, MediaStream>
  >({});
  const [isAudioMuted, setIsAudioMuted] = useState(false);
  const [isVideoOff, setIsVideoOff] = useState(false);
  const [isScreenSharing, setIsScreenSharing] = useState(false);
  const [durationSec, setDurationSec] = useState(0);

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
          name: conversation.name || "Người dùng",
          avatar: conversation.avatar || null,
        };
      }
      return {
        id: userId,
        name: "Thành viên",
        avatar: null,
      };
    },
    [activeCall, conversation, isGroupCall],
  );

  const fetchIceServers = useCallback(async (): Promise<RTCIceServer[]> => {
    if (iceServersCacheRef.current) return iceServersCacheRef.current;
    const fallback: RTCIceServer[] = [
      { urls: "stun:stun.l.google.com:19302" },
      { urls: "stun:stun1.l.google.com:19302" },
    ];
    try {
      const res = await getIceServersApi();
      if (res?.data?.iceServers) {
        iceServersCacheRef.current = res.data.iceServers;
        return res.data.iceServers;
      }
    } catch {
      // Fallback to default STUN
    }
    return fallback;
  }, []);

  const ensureLocalMediaStream = useCallback(async (withVideo: boolean) => {
    if (localStreamRef.current) {
      return localStreamRef.current;
    }

    try {
      const mediaStream = await navigator.mediaDevices.getUserMedia({
        audio: {
          echoCancellation: true,
          noiseSuppression: true,
          autoGainControl: true,
        },
        video: withVideo
          ? {
              width: { ideal: 1280 },
              height: { ideal: 720 },
              facingMode: "user",
            }
          : false,
      });
      localStreamRef.current = mediaStream;
      setIsVideoOff(!withVideo);

      if (localVideoRef.current) {
        localVideoRef.current.srcObject = mediaStream;
      }
      return mediaStream;
    } catch (err) {
      // Nếu thiết bị không có Camera nhưng có Mic, fallback xuống chỉ lấy Audio
      if (withVideo) {
        const audioOnlyStream = await navigator.mediaDevices.getUserMedia({
          audio: true,
          video: false,
        });
        localStreamRef.current = audioOnlyStream;
        setIsVideoOff(true);
        toast.info("Không tìm thấy Camera, đã chuyển sang chế độ âm thanh");
        return audioOnlyStream;
      }
      throw err;
    }
  }, []);

  const flushPendingCandidates = useCallback(
    async (targetUserId: string, pc: RTCPeerConnection) => {
      if (!pc.remoteDescription) return;
      const queue = pendingCandidatesRef.current.get(targetUserId) || [];
      if (queue.length === 0) return;

      pendingCandidatesRef.current.delete(targetUserId);
      for (const candidate of queue) {
        try {
          await pc.addIceCandidate(new RTCIceCandidate(candidate));
        } catch (err) {
          console.warn("ICE candidate flush warning:", err);
        }
      }
    },
    [],
  );

  const removePeerConnection = useCallback((targetUserId: string) => {
    const pc = peersRef.current.get(targetUserId);
    if (pc) {
      pc.onicecandidate = null;
      pc.ontrack = null;
      pc.onconnectionstatechange = null;
      pc.close();
      peersRef.current.delete(targetUserId);
    }
    pendingCandidatesRef.current.delete(targetUserId);
    initiatedOffersRef.current.delete(targetUserId);
    setRemoteStreams((prev) => {
      const next = { ...prev };
      delete next[targetUserId];
      return next;
    });
  }, []);

  const cleanupAllMediaAndPeers = useCallback(() => {
    if (localStreamRef.current) {
      localStreamRef.current.getTracks().forEach((track) => track.stop());
      localStreamRef.current = null;
    }
    if (screenStreamRef.current) {
      screenStreamRef.current.getTracks().forEach((track) => track.stop());
      screenStreamRef.current = null;
    }
    peersRef.current.forEach((pc) => {
      pc.onicecandidate = null;
      pc.ontrack = null;
      pc.onconnectionstatechange = null;
      pc.close();
    });
    peersRef.current.clear();
    pendingCandidatesRef.current.clear();
    initiatedOffersRef.current.clear();
    setRemoteStreams({});
    setIsAudioMuted(false);
    setIsVideoOff(false);
    setIsScreenSharing(false);
    setDurationSec(0);
  }, []);

  const getOrCreatePeerConnection = useCallback(
    async (callId: string, targetUserId: string, isVideo: boolean) => {
      const existing = peersRef.current.get(targetUserId);
      if (existing) return existing;

      const iceServers = await fetchIceServers();
      const pc = new RTCPeerConnection({ iceServers });
      peersRef.current.set(targetUserId, pc);

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

      pc.ontrack = (event) => {
        const stream = event.streams?.[0];
        if (stream) {
          setRemoteStreams((prev) => ({
            ...prev,
            [targetUserId]: stream,
          }));
        }
      };

      pc.onconnectionstatechange = () => {
        if (
          pc.connectionState === "failed" ||
          pc.connectionState === "closed"
        ) {
          // Tự động dọn dẹp nếu peer đóng hoàn toàn
        }
      };

      const mediaStream = await ensureLocalMediaStream(isVideo);
      mediaStream.getTracks().forEach((track) => {
        pc.addTrack(track, mediaStream);
      });

      return pc;
    },
    [ensureLocalMediaStream, fetchIceServers],
  );

  // Gán lại localVideoRef khi phóng to/thu nhỏ hoặc bật camera
  useEffect(() => {
    if (localVideoRef.current) {
      const activeLocal = screenStreamRef.current || localStreamRef.current;
      if (activeLocal && localVideoRef.current.srcObject !== activeLocal) {
        localVideoRef.current.srcObject = activeLocal;
      }
    }
  }, [activeCall?.isMinimized, isVideoOff, isScreenSharing]);

  // Lắng nghe tín hiệu WebRTC & sự kiện tham gia/rời phòng gọi nhóm
  useEffect(() => {
    if (!activeCall) {
      cleanupAllMediaAndPeers();
      return;
    }

    const cleanSignal = socketService.on<any>(
      SocketNamespaceEnum.CHAT,
      SOCKET_EVENTS.CALL.SIGNAL,
      async (payload) => {
        if (payload.callId !== activeCall.callId) return;
        const fromUserId = payload.fromUserId as string;
        if (!fromUserId || fromUserId === currentUser?.id) return;

        try {
          if (payload.type === "offer" || payload.type === "renegotiate") {
            const pc = await getOrCreatePeerConnection(
              activeCall.callId,
              fromUserId,
              activeCall.callType === CallTypeEnum.VIDEO,
            );
            await pc.setRemoteDescription(
              new RTCSessionDescription(payload.signalData),
            );
            await flushPendingCandidates(fromUserId, pc);
            const answer = await pc.createAnswer();
            await pc.setLocalDescription(answer);
            socketService.send(
              SocketNamespaceEnum.CHAT,
              SOCKET_EVENTS.CALL.SIGNAL,
              {
                callId: activeCall.callId,
                targetUserId: fromUserId,
                type: "answer",
                signalData: answer,
              },
            );
          } else if (payload.type === "answer") {
            const pc = peersRef.current.get(fromUserId);
            if (!pc) return;
            await pc.setRemoteDescription(
              new RTCSessionDescription(payload.signalData),
            );
            await flushPendingCandidates(fromUserId, pc);
          } else if (payload.type === "ice-candidate" && payload.signalData) {
            const pc = peersRef.current.get(fromUserId);
            if (pc && pc.remoteDescription) {
              await pc.addIceCandidate(new RTCIceCandidate(payload.signalData));
            } else {
              const list = pendingCandidatesRef.current.get(fromUserId) || [];
              list.push(payload.signalData);
              pendingCandidatesRef.current.set(fromUserId, list);
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
        if (payload.callId !== activeCall.callId) return;
        updateActiveCall({
          participants: payload.participants || {},
          membersInfo: payload.membersInfo || activeCall.membersInfo,
        });

        const joinedUserId = payload.userId as string;
        if (
          joinedUserId &&
          joinedUserId !== currentUser?.id &&
          !initiatedOffersRef.current.has(joinedUserId)
        ) {
          initiatedOffersRef.current.add(joinedUserId);
          try {
            const pc = await getOrCreatePeerConnection(
              activeCall.callId,
              joinedUserId,
              activeCall.callType === CallTypeEnum.VIDEO,
            );
            const offer = await pc.createOffer();
            await pc.setLocalDescription(offer);
            socketService.send(
              SocketNamespaceEnum.CHAT,
              SOCKET_EVENTS.CALL.SIGNAL,
              {
                callId: activeCall.callId,
                targetUserId: joinedUserId,
                type: "offer",
                signalData: offer,
              },
            );
          } catch (err) {
            console.error("Mesh offer error:", err);
          }
        }
      },
    );

    const cleanParticipantLeft = socketService.on<any>(
      SocketNamespaceEnum.CHAT,
      SOCKET_EVENTS.CALL.PARTICIPANT_LEFT,
      (payload) => {
        if (payload.callId !== activeCall.callId) return;
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

    return () => {
      cleanSignal();
      cleanParticipantJoined();
      cleanParticipantLeft();
    };
  }, [
    activeCall,
    currentUser?.id,
    cleanupAllMediaAndPeers,
    flushPendingCandidates,
    getOrCreatePeerConnection,
    removePeerConnection,
    updateActiveCall,
  ]);

  // Người gọi khởi tạo Offer khi cuộc gọi chuyển sang ONGOING (với những thành viên chưa có kết nối)
  useEffect(() => {
    if (!activeCall || activeCall.isIncoming) return;
    if (activeCall.status !== CallStatusEnum.ONGOING) return;

    const partnerIds = Object.keys(activeCall.participants || {}).filter(
      (id) => id !== currentUser?.id,
    );
    if (partnerIds.length === 0 && conversation?.partnerId) {
      partnerIds.push(conversation.partnerId);
    }

    partnerIds.forEach((targetId) => {
      if (!targetId || initiatedOffersRef.current.has(targetId)) return;
      initiatedOffersRef.current.add(targetId);

      (async () => {
        try {
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
              signalData: offer,
            },
          );
        } catch (err: any) {
          toast.error(
            err?.message ||
              "Không thể truy cập Microphone/Camera trên thiết bị",
          );
        }
      })();
    });
  }, [
    activeCall,
    currentUser?.id,
    conversation?.partnerId,
    getOrCreatePeerConnection,
  ]);

  // Bộ đếm thời gian cuộc gọi
  useEffect(() => {
    if (!activeCall || activeCall.status !== CallStatusEnum.ONGOING) return;
    const timer = setInterval(() => {
      setDurationSec((s) => s + 1);
    }, 1000);
    return () => clearInterval(timer);
  }, [activeCall?.status]);

  // Tự động ngắt kết nối khi đóng tab trình duyệt
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
      toast.error(err?.message || "Không thể nhận cuộc gọi");
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

  const handleHangup = async () => {
    try {
      await socketService.emit(
        SocketNamespaceEnum.CHAT,
        SOCKET_EVENTS.CALL.HANGUP,
        { callId: activeCall.callId },
      );
    } finally {
      cleanupAllMediaAndPeers();
      setActiveCall(null);
    }
  };

  const toggleAudio = () => {
    const stream = localStreamRef.current;
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
    const stream = localStreamRef.current;
    if (!stream) return;

    const existingVideoTracks = stream.getVideoTracks();

    // Nếu cuộc gọi bắt đầu bằng AUDIO (chưa có video track), xin quyền Camera và nâng cấp lên VIDEO
    if (existingVideoTracks.length === 0) {
      try {
        const camStream = await navigator.mediaDevices.getUserMedia({
          video: { width: { ideal: 1280 }, height: { ideal: 720 } },
        });
        const newVideoTrack = camStream.getVideoTracks()[0];
        if (!newVideoTrack) return;

        stream.addTrack(newVideoTrack);
        if (localVideoRef.current) {
          localVideoRef.current.srcObject = stream;
        }

        // Gắn track mới và thương lượng lại (renegotiate) với tất cả peers
        for (const [targetUserId, pc] of peersRef.current.entries()) {
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
        toast.error("Không thể bật Camera trên thiết bị này");
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
        screenStreamRef.current = displayStream;
        const screenTrack = displayStream.getVideoTracks()[0];

        for (const [targetUserId, pc] of peersRef.current.entries()) {
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

        if (localVideoRef.current) {
          localVideoRef.current.srcObject = displayStream;
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
    } catch {
      // Người dùng hủy chọn màn hình
    }
  };

  const stopScreenShare = async () => {
    if (screenStreamRef.current) {
      screenStreamRef.current.getTracks().forEach((t) => t.stop());
      screenStreamRef.current = null;
    }
    const camTrack = localStreamRef.current?.getVideoTracks()[0] || null;
    for (const pc of peersRef.current.values()) {
      const sender = pc.getSenders().find((s) => s.track?.kind === "video");
      if (sender && camTrack) {
        await sender.replaceTrack(camTrack);
      }
    }
    if (localVideoRef.current && localStreamRef.current) {
      localVideoRef.current.srcObject = localStreamRef.current;
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
  ).filter((id) => id !== currentUser?.id);

  const displayTitle =
    conversation?.name || activeCall.callerName || "Cuộc gọi trực tuyến";
  const displayAvatar = conversation?.avatar || activeCall.callerAvatar;

  // Chế độ thu nhỏ (Floating Mini Call Bar)
  if (activeCall.isMinimized) {
    return (
      <div className="fixed bottom-6 right-6 z-50 w-80 animate-in fade-in slide-in-from-bottom-3">
        <LiquidGlassModal className="p-3.5 flex items-center justify-between gap-3 border border-white/30 shadow-2xl">
          <div className="flex items-center gap-3 min-w-0">
            <div className="relative shrink-0">
              <Avatar className="h-10 w-10 border border-white/30">
                <AvatarImage src={displayAvatar || undefined} />
                <AvatarFallback className="bg-indigo-600 text-white text-xs font-bold">
                  {displayTitle.substring(0, 2).toUpperCase()}
                </AvatarFallback>
              </Avatar>
              <span className="absolute -bottom-0.5 -right-0.5 h-3 w-3 rounded-full bg-emerald-500 ring-2 ring-background animate-pulse" />
            </div>
            <div className="flex flex-col min-w-0">
              <span className="text-xs font-semibold truncate">
                {displayTitle}
              </span>
              <span className="text-[11px] text-emerald-500 font-mono font-medium">
                {activeCall.status === CallStatusEnum.ONGOING
                  ? formatTimer(durationSec)
                  : "Đang đổ chuông..."}
              </span>
            </div>
          </div>
          <div className="flex items-center gap-1.5 shrink-0">
            <PatternButton
              size="icon"
              variant={isAudioMuted ? "solid" : "ghost"}
              color={isAudioMuted ? "danger" : "neutral"}
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
              onClick={handleHangup}
            >
              <PhoneOff className="h-4 w-4" />
            </PatternButton>
          </div>
        </LiquidGlassModal>
      </div>
    );
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 backdrop-blur-md p-3 md:p-6 animate-in fade-in duration-200">
      <LiquidGlassModal
        className="w-full max-w-4xl overflow-hidden border border-white/25 shadow-2xl"
        rounded="3xl"
      >
        <div className="relative flex flex-col h-[82vh] max-h-[680px] min-h-[480px] w-full bg-gradient-to-br from-slate-900/95 via-indigo-950/85 to-slate-950/95 text-white">
          {/* Top Bar */}
          <div className="flex items-center justify-between px-6 py-4 z-20">
            <div className="flex items-center gap-2.5">
              <div className="flex items-center gap-1.5 text-xs text-emerald-300/95 bg-emerald-500/15 border border-emerald-400/25 px-3 py-1 rounded-full backdrop-blur-md">
                <ShieldCheck className="w-3.5 h-3.5" />
                <span>Mã hóa DTLS-SRTP</span>
              </div>

              {isGroupCall && (
                <div className="flex items-center gap-1.5 text-xs text-indigo-200 bg-indigo-500/20 border border-indigo-400/30 px-3 py-1 rounded-full">
                  <Users className="w-3.5 h-3.5" />
                  <span>
                    {Object.keys(activeCall.participants || {}).length} thành
                    viên
                  </span>
                </div>
              )}
            </div>

            <div className="flex items-center gap-3">
              {activeCall.status === CallStatusEnum.ONGOING && (
                <span className="text-xs font-mono bg-white/10 px-3 py-1 rounded-full border border-white/15">
                  {formatTimer(durationSec)}
                </span>
              )}

              {activeCall.status === CallStatusEnum.ONGOING && (
                <PatternButton
                  size="icon"
                  variant="glass"
                  rounded="full"
                  className="h-8 w-8 text-white"
                  onClick={() => updateActiveCall({ isMinimized: true })}
                  title="Thu nhỏ cửa sổ cuộc gọi"
                >
                  <Minimize2 className="w-4 h-4" />
                </PatternButton>
              )}
            </div>
          </div>

          {/* Khu vực hiển thị Video / Avatar */}
          <div className="relative flex-1 flex flex-col items-center justify-center overflow-hidden px-4 md:px-6">
            {activeCall.status === CallStatusEnum.RINGING ? (
              <div className="relative z-10 flex flex-col items-center gap-5">
                <div className="relative">
                  <div className="absolute -inset-4 rounded-full bg-indigo-500/25 animate-ping" />
                  <div className="absolute -inset-8 rounded-full bg-indigo-500/10 animate-pulse" />
                  <Avatar className="h-28 w-28 border-2 border-white/40 shadow-2xl">
                    <AvatarImage src={displayAvatar || undefined} />
                    <AvatarFallback className="bg-indigo-600 text-white text-2xl font-bold">
                      {displayTitle.substring(0, 2).toUpperCase()}
                    </AvatarFallback>
                  </Avatar>
                </div>

                <div className="text-center space-y-1.5">
                  <h3 className="text-xl font-bold tracking-tight">
                    {displayTitle}
                  </h3>
                  <p className="text-sm text-white/75">
                    {activeCall.isIncoming
                      ? `Đang gọi ${activeCall.callType === CallTypeEnum.VIDEO ? "video" : "thoại"}${isGroupCall ? " nhóm" : ""} cho bạn...`
                      : "Đang đổ chuông..."}
                  </p>
                </div>
              </div>
            ) : remoteParticipantIds.length <= 1 ? (
              /* Chế độ 1-1: Fullscreen đối phương */
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
                      isSingleRemote
                    />
                  );
                })}
              </div>
            ) : (
              /* Chế độ Gọi Nhóm (Multi-Participant Grid Layout) */
              <div
                className={cn(
                  "grid gap-3 w-full h-full py-1",
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
                    />
                  );
                })}
              </div>
            )}

            {/* Khung Video của bản thân (Local PiP) */}
            {(activeCall.callType === CallTypeEnum.VIDEO ||
              !isVideoOff ||
              isScreenSharing) && (
              <div className="absolute bottom-4 right-6 z-20 w-36 h-24 md:w-44 md:h-30 rounded-2xl overflow-hidden border border-white/35 shadow-2xl bg-slate-900/80 backdrop-blur-md">
                <video
                  ref={localVideoRef}
                  autoPlay
                  muted
                  playsInline
                  className={cn(
                    "w-full h-full object-cover",
                    isVideoOff && !isScreenSharing && "hidden",
                  )}
                />
                {isVideoOff && !isScreenSharing && (
                  <div className="w-full h-full flex flex-col items-center justify-center gap-1 text-[11px] text-white/60">
                    <VideoOff className="w-4 h-4 opacity-70" />
                    <span>Camera tắt</span>
                  </div>
                )}
                <span className="absolute bottom-1.5 left-2 text-[10px] px-2 py-0.5 rounded-full bg-black/60 text-white/90">
                  Bạn {isScreenSharing ? "(Màn hình)" : ""}
                </span>
              </div>
            )}
          </div>

          {/* Thanh điều khiển cuộc gọi (Bottom Controls) */}
          <div className="p-5 flex justify-center z-20">
            <LiquidGlass
              variant="frosted"
              blur="2xl"
              opacity="30"
              rounded="full"
              border="highlight"
              fluid={false}
              className="px-6 py-3 flex items-center gap-3 md:gap-4 shadow-2xl"
            >
              {activeCall.status === CallStatusEnum.RINGING &&
              activeCall.isIncoming ? (
                <>
                  <PatternButton
                    variant="solid"
                    color="success"
                    rounded="full"
                    size="lg"
                    onClick={handleAcceptCall}
                    icon={<PhoneCall className="w-5 h-5" />}
                  >
                    Trả lời
                  </PatternButton>
                  <PatternButton
                    variant="solid"
                    color="danger"
                    rounded="full"
                    size="lg"
                    onClick={handleRejectCall}
                    icon={<PhoneOff className="w-5 h-5" />}
                  >
                    Từ chối
                  </PatternButton>
                </>
              ) : (
                <>
                  <PatternButton
                    variant={isAudioMuted ? "solid" : "glass"}
                    color={isAudioMuted ? "danger" : "neutral"}
                    size="icon"
                    rounded="full"
                    className="h-12 w-12 text-white"
                    onClick={toggleAudio}
                    title={isAudioMuted ? "Bật Micro" : "Tắt Micro"}
                  >
                    {isAudioMuted ? (
                      <MicOff className="w-5 h-5" />
                    ) : (
                      <Mic className="w-5 h-5" />
                    )}
                  </PatternButton>

                  <PatternButton
                    variant={isVideoOff ? "solid" : "glass"}
                    color={isVideoOff ? "danger" : "neutral"}
                    size="icon"
                    rounded="full"
                    className="h-12 w-12 text-white"
                    onClick={toggleVideo}
                    title={isVideoOff ? "Bật Camera" : "Tắt Camera"}
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
                      color={isScreenSharing ? "info" : "neutral"}
                      size="icon"
                      rounded="full"
                      className="h-12 w-12 text-white"
                      onClick={toggleScreenShare}
                      title={
                        isScreenSharing
                          ? "Dừng chia sẻ màn hình"
                          : "Chia sẻ màn hình"
                      }
                    >
                      <MonitorUp className="w-5 h-5" />
                    </PatternButton>
                  )}

                  <PatternButton
                    variant="solid"
                    color="danger"
                    size="icon"
                    rounded="full"
                    className="h-12 w-12"
                    onClick={handleHangup}
                    title="Kết thúc cuộc gọi"
                  >
                    <PhoneOff className="w-5 h-5" />
                  </PatternButton>
                </>
              )}
            </LiquidGlass>
          </div>
        </div>
      </LiquidGlassModal>
    </div>
  );
}
