/** biome-ignore-all lint/a11y/useMediaCaption: <explanation> */
"use client";

import React, { useCallback, useEffect, useRef, useState } from "react";
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
  SocketNamespaceEnum,
} from "@/common/enum";
import { SOCKET_EVENTS } from "@/constant/socket-events";
import { socketService } from "@/services/socket/socket-client";
import { getIceServersApi } from "@/lib/stores/chat/api";
import { toast } from "sonner";
import { cn } from "@/lib/utils";

export function CallModal() {
  const { activeCall, setActiveCall, updateActiveCall, conversations } =
    useChatStore();
  const currentUser = useAuthStore((s) => s.currentAccount?.user);

  const localVideoRef = useRef<HTMLVideoElement | null>(null);
  const remoteVideoRef = useRef<HTMLVideoElement | null>(null);
  const peerRef = useRef<RTCPeerConnection | null>(null);
  const localStreamRef = useRef<MediaStream | null>(null);

  const [isAudioMuted, setIsAudioMuted] = useState(false);
  const [isVideoOff, setIsVideoOff] = useState(false);
  const [isScreenSharing, setIsScreenSharing] = useState(false);
  const [durationSec, setDurationSec] = useState(0);

  const conversation = conversations.find(
    (c) => c.id === activeCall?.conversationId,
  );

  const cleanupMediaAndPeer = useCallback(() => {
    if (localStreamRef.current) {
      localStreamRef.current.getTracks().forEach((track) => track.stop());
      localStreamRef.current = null;
    }
    if (peerRef.current) {
      peerRef.current.close();
      peerRef.current = null;
    }
    setIsAudioMuted(false);
    setIsVideoOff(false);
    setIsScreenSharing(false);
    setDurationSec(0);
  }, []);

  const setupPeerConnection = useCallback(
    async (callId: string, targetUserId: string, isVideo: boolean) => {
      let iceServers: RTCIceServer[] = [
        { urls: "stun:stun.l.google.com:19302" },
      ];
      try {
        const res = await getIceServersApi();
        if (res?.data?.iceServers) {
          iceServers = res.data.iceServers;
        }
      } catch {
        // Fallback to default STUN
      }

      const pc = new RTCPeerConnection({ iceServers });
      peerRef.current = pc;

      pc.onicecandidate = (event) => {
        if (event.candidate && targetUserId) {
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
        if (remoteVideoRef.current && event.streams[0]) {
          remoteVideoRef.current.srcObject = event.streams[0];
        }
      };

      const mediaStream = await navigator.mediaDevices.getUserMedia({
        audio: true,
        video: isVideo,
      });
      localStreamRef.current = mediaStream;
      setIsVideoOff(!isVideo);

      if (localVideoRef.current) {
        localVideoRef.current.srcObject = mediaStream;
      }

      mediaStream.getTracks().forEach((track) => {
        pc.addTrack(track, mediaStream);
      });

      return pc;
    },
    [],
  );

  useEffect(() => {
    if (!activeCall) {
      cleanupMediaAndPeer();
      return;
    }

    const cleanSignal = socketService.on<any>(
      SocketNamespaceEnum.CHAT,
      SOCKET_EVENTS.CALL.SIGNAL,
      async (payload) => {
        if (payload.callId !== activeCall.callId) return;
        const pc = peerRef.current;
        if (!pc) return;

        try {
          if (payload.type === "offer") {
            await pc.setRemoteDescription(
              new RTCSessionDescription(payload.signalData),
            );
            const answer = await pc.createAnswer();
            await pc.setLocalDescription(answer);
            socketService.send(
              SocketNamespaceEnum.CHAT,
              SOCKET_EVENTS.CALL.SIGNAL,
              {
                callId: activeCall.callId,
                targetUserId: payload.fromUserId,
                type: "answer",
                signalData: answer,
              },
            );
          } else if (payload.type === "answer") {
            await pc.setRemoteDescription(
              new RTCSessionDescription(payload.signalData),
            );
          } else if (payload.type === "ice-candidate") {
            await pc.addIceCandidate(new RTCIceCandidate(payload.signalData));
          }
        } catch (err) {
          console.error("WebRTC signal error:", err);
        }
      },
    );

    return () => {
      cleanSignal();
    };
  }, [activeCall, cleanupMediaAndPeer]);

  useEffect(() => {
    if (!activeCall || activeCall.isIncoming) return;
    if (activeCall.status !== CallStatusEnum.ONGOING) return;
    if (peerRef.current) return;

    const partnerIds = Object.keys(activeCall.participants || {}).filter(
      (id) => id !== currentUser?.id,
    );
    const targetId = partnerIds[0] || conversation?.partnerId || "";
    if (!targetId) return;

    (async () => {
      try {
        const pc = await setupPeerConnection(
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
          err?.message || "Không thể truy cập Microphone/Camera trên thiết bị",
        );
      }
    })();
  }, [
    activeCall,
    currentUser?.id,
    conversation?.partnerId,
    setupPeerConnection,
  ]);

  useEffect(() => {
    if (!activeCall || activeCall.status !== CallStatusEnum.ONGOING) return;
    const timer = setInterval(() => {
      setDurationSec((s) => s + 1);
    }, 1000);
    return () => clearInterval(timer);
  }, [activeCall]);

  if (!activeCall) return null;

  const formatTimer = (sec: number) => {
    const mins = Math.floor(sec / 60)
      .toString()
      .padStart(2, "0");
    const rem = (sec % 60).toString().padStart(2, "0");
    return `${mins}:${rem}`;
  };

  const handleAcceptCall = async () => {
    try {
      const pc = await setupPeerConnection(
        activeCall.callId,
        activeCall.initiatorId,
        activeCall.callType === CallTypeEnum.VIDEO,
      );

      await socketService.emit(
        SocketNamespaceEnum.CHAT,
        SOCKET_EVENTS.CALL.ACCEPT,
        { callId: activeCall.callId },
      );

      if (activeCall.sdpOffer) {
        await pc.setRemoteDescription(
          new RTCSessionDescription(activeCall.sdpOffer),
        );
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
      cleanupMediaAndPeer();
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
      cleanupMediaAndPeer();
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

  const toggleVideo = () => {
    const stream = localStreamRef.current;
    if (!stream) return;
    const nextOff = !isVideoOff;
    stream.getVideoTracks().forEach((t) => {
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
    if (!peerRef.current) return;
    try {
      if (!isScreenSharing) {
        const displayStream = await navigator.mediaDevices.getDisplayMedia({
          video: true,
        });
        const screenTrack = displayStream.getVideoTracks()[0];
        const sender = peerRef.current
          .getSenders()
          .find((s) => s.track?.kind === "video");
        if (sender) {
          await sender.replaceTrack(screenTrack);
        }
        if (localVideoRef.current) {
          localVideoRef.current.srcObject = displayStream;
        }
        setIsScreenSharing(true);
        screenTrack.onended = () => {
          const camTrack = localStreamRef.current?.getVideoTracks()[0];
          if (sender && camTrack) sender.replaceTrack(camTrack);
          if (localVideoRef.current && localStreamRef.current) {
            localVideoRef.current.srcObject = localStreamRef.current;
          }
          setIsScreenSharing(false);
        };
      }
    } catch {
      // User cancelled screen picker
    }
  };

  if (activeCall.isMinimized) {
    return (
      <div className="fixed bottom-6 right-6 z-50 w-72">
        <LiquidGlassModal className="p-3 flex items-center justify-between gap-3 border border-white/30">
          <div className="flex items-center gap-2.5 min-w-0">
            <span className="h-2.5 w-2.5 rounded-full bg-emerald-500 animate-ping shrink-0" />
            <div className="flex flex-col min-w-0">
              <span className="text-xs font-semibold truncate">
                {conversation?.name || "Đang trong cuộc gọi"}
              </span>
              <span className="text-[10px] text-muted-foreground font-mono">
                {formatTimer(durationSec)}
              </span>
            </div>
          </div>
          <div className="flex items-center gap-1">
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
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-md p-4 animate-in fade-in duration-300">
      <LiquidGlassModal
        className="w-full max-w-3xl overflow-hidden border border-white/30 shadow-2xl"
        rounded="3xl"
      >
        <div className="relative flex flex-col h-[540px] w-full bg-gradient-to-br from-slate-900/90 via-indigo-950/80 to-slate-950/95 text-white">
          <div className="flex items-center justify-between px-6 py-4 z-20">
            <div className="flex items-center gap-2 text-xs text-emerald-300/90 bg-emerald-500/10 border border-emerald-400/20 px-3 py-1 rounded-full backdrop-blur-md">
              <ShieldCheck className="w-3.5 h-3.5" />
              <span>Mã hóa WebRTC DTLS-SRTP</span>
            </div>

            {activeCall.status === CallStatusEnum.ONGOING && (
              <PatternButton
                size="icon"
                variant="glass"
                rounded="full"
                className="h-8 w-8 text-white"
                onClick={() => updateActiveCall({ isMinimized: true })}
              >
                <Minimize2 className="w-4 h-4" />
              </PatternButton>
            )}
          </div>

          <div className="relative flex-1 flex flex-col items-center justify-center overflow-hidden px-6">
            {activeCall.callType === CallTypeEnum.VIDEO &&
              activeCall.status === CallStatusEnum.ONGOING && (
                <video
                  ref={remoteVideoRef}
                  autoPlay
                  playsInline
                  className="absolute inset-0 w-full h-full object-cover z-0"
                />
              )}

            {(activeCall.status === CallStatusEnum.RINGING ||
              activeCall.callType === CallTypeEnum.AUDIO) && (
              <div className="relative z-10 flex flex-col items-center gap-4">
                <div className="relative">
                  <div className="absolute -inset-4 rounded-full bg-indigo-500/20 animate-ping" />
                  <Avatar className="h-28 w-28 border-2 border-white/40 shadow-2xl">
                    <AvatarImage src={conversation?.avatar} />
                    <AvatarFallback className="bg-indigo-600 text-white text-2xl font-bold">
                      {(conversation?.name || "U")
                        .substring(0, 2)
                        .toUpperCase()}
                    </AvatarFallback>
                  </Avatar>
                </div>

                <div className="text-center space-y-1">
                  <h3 className="text-xl font-bold tracking-tight">
                    {conversation?.name || "Cuộc gọi trực tuyến"}
                  </h3>
                  <p className="text-sm text-white/70">
                    {activeCall.status === CallStatusEnum.RINGING
                      ? activeCall.isIncoming
                        ? `Đang gọi ${activeCall.callType === CallTypeEnum.VIDEO ? "video" : "thoại"} cho bạn...`
                        : "Đang đổ chuông..."
                      : formatTimer(durationSec)}
                  </p>
                </div>
              </div>
            )}

            {activeCall.callType === CallTypeEnum.VIDEO && (
              <div className="absolute bottom-4 right-6 z-20 w-40 h-28 rounded-2xl overflow-hidden border border-white/30 shadow-xl bg-black/50 backdrop-blur-md">
                <video
                  ref={localVideoRef}
                  autoPlay
                  muted
                  playsInline
                  className={cn(
                    "w-full h-full object-cover",
                    isVideoOff && "hidden",
                  )}
                />
                {isVideoOff && (
                  <div className="w-full h-full flex items-center justify-center text-xs text-white/60">
                    Camera tắt
                  </div>
                )}
              </div>
            )}
          </div>

          <div className="p-6 flex justify-center z-20">
            <LiquidGlass
              variant="frosted"
              blur="2xl"
              opacity="30"
              rounded="full"
              border="highlight"
              fluid={false}
              className="px-6 py-3 flex items-center gap-4 shadow-2xl"
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
                  >
                    {isAudioMuted ? (
                      <MicOff className="w-5 h-5" />
                    ) : (
                      <Mic className="w-5 h-5" />
                    )}
                  </PatternButton>

                  {activeCall.callType === CallTypeEnum.VIDEO && (
                    <>
                      <PatternButton
                        variant={isVideoOff ? "solid" : "glass"}
                        color={isVideoOff ? "danger" : "neutral"}
                        size="icon"
                        rounded="full"
                        className="h-12 w-12 text-white"
                        onClick={toggleVideo}
                      >
                        {isVideoOff ? (
                          <VideoOff className="w-5 h-5" />
                        ) : (
                          <VideoIcon className="w-5 h-5" />
                        )}
                      </PatternButton>

                      <PatternButton
                        variant={isScreenSharing ? "solid" : "glass"}
                        color={isScreenSharing ? "info" : "neutral"}
                        size="icon"
                        rounded="full"
                        className="h-12 w-12 text-white"
                        onClick={toggleScreenShare}
                      >
                        <MonitorUp className="w-5 h-5" />
                      </PatternButton>
                    </>
                  )}

                  <PatternButton
                    variant="solid"
                    color="danger"
                    size="icon"
                    rounded="full"
                    className="h-12 w-12"
                    onClick={handleHangup}
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
