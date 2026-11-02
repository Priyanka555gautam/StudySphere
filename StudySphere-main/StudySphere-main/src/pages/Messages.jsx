import React, { useState, useEffect, useRef } from "react";
import { Link, useSearchParams, useNavigate } from "react-router-dom";
import { io } from "socket.io-client";
import { messagingApi, friendApi, authApi } from "../lib/api";
import {
  MessageSquare,
  Users,
  UserPlus,
  Send,
  Plus,
  CheckCircle,
  XCircle,
  Share2,
  ExternalLink,
  Shield,
  Search,
  UserCheck,
  ArrowLeft,
  Sun,
  Moon,
  Sparkles,
  MessageCircleMore,
  X,
  LogOut
} from "lucide-react";

const API_BASE_URL = import.meta.env.VITE_API_URL || "http://localhost:4000";

export default function Messages() {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const initialConvId = searchParams.get("conv");

  const [currentUser, setCurrentUser] = useState(null);
  const [conversations, setConversations] = useState([]);
  const [activeConv, setActiveConv] = useState(null);
  const [messages, setMessages] = useState([]);
  const [newMessageText, setNewMessageText] = useState("");
  const [activeTab, setActiveTab] = useState("chats"); // 'chats' | 'groups' | 'friends' | 'admin'

  // Dark mode state shared with Community
  const [isDarkMode, setIsDarkMode] = useState(() => {
    return localStorage.getItem("community_dark_mode") === "true";
  });

  // Friends & Friend Requests
  const [friends, setFriends] = useState([]);
  const [friendRequests, setFriendRequests] = useState([]);

  // Groups & Join Requests
  const [allGroups, setAllGroups] = useState([]);
  const [adminJoinRequests, setAdminJoinRequests] = useState([]);

  // Group Create Modal
  const [showCreateGroup, setShowCreateGroup] = useState(false);
  const [groupName, setGroupName] = useState("");
  const [groupDesc, setGroupDesc] = useState("");
  const [groupIcon, setGroupIcon] = useState("💬");
  const [selectedFriendsForGroup, setSelectedFriendsForGroup] = useState([]);

  // Group Members / Manage Modal
  const [showGroupMembers, setShowGroupMembers] = useState(false);
  const [groupMembers, setGroupMembers] = useState([]);
  const [loadingGroupMembers, setLoadingGroupMembers] = useState(false);
  const [addingMemberId, setAddingMemberId] = useState("");
  const [leavingGroup, setLeavingGroup] = useState(false);

  const socketRef = useRef(null);
  const activeConvRef = useRef(null);
  const messagesEndRef = useRef(null);

  useEffect(() => {
    localStorage.setItem("community_dark_mode", isDarkMode);
  }, [isDarkMode]);

  useEffect(() => {
    initUserAndSocket();
    return () => {
      if (socketRef.current) {
        socketRef.current.disconnect();
      }
    };
  }, []);

  async function initUserAndSocket() {
    try {
      const { user } = await authApi.me();
      setCurrentUser(user);

      // Connect Socket.IO
      const socket = io(API_BASE_URL, { credentials: "include" });
      socketRef.current = socket;

      socket.on("connect", () => {
        console.log("Connected to socket server");
      });

      socket.on("new_message", (msg) => {
        if (msg.conversation_id === activeConvRef.current?.id) {
          setMessages((prev) => {
            if (prev.some((m) => m.id === msg.id)) return prev;
            return [...prev, msg];
          });
        }
        loadConversations();
      });

      loadConversations(initialConvId);
      loadFriendsAndRequests();
      loadGroupsData();
    } catch (err) {
      console.error("Auth / Socket init error:", err);
    }
  }

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  async function loadConversations(autoSelectId = null) {
    try {
      const list = await messagingApi.getConversations();
      setConversations(list);
      if (autoSelectId) {
        const found = list.find((c) => c.id === autoSelectId);
        if (found) selectConversation(found);
      } else if (list.length > 0 && !activeConv) {
        selectConversation(list[0]);
      }
    } catch (err) {
      console.error(err);
    }
  }

  async function loadFriendsAndRequests() {
    try {
      const frs = await friendApi.getFriends();
      setFriends(frs);
      const reqs = await friendApi.getRequests();
      setFriendRequests(reqs);
    } catch (err) {
      console.error(err);
    }
  }

  async function loadGroupsData() {
    try {
      const grps = await messagingApi.listGroups();
      setAllGroups(grps);
      const reqs = await messagingApi.getPendingJoinRequests();
      setAdminJoinRequests(reqs);
    } catch (err) {
      console.error(err);
    }
  }

  async function selectConversation(conv) {
    const previousConv = activeConvRef.current;
    setActiveConv(conv);
    activeConvRef.current = conv;
    if (socketRef.current) {
      if (previousConv && previousConv.id !== conv.id) {
        socketRef.current.emit("leave_conversation", previousConv.id);
      }
      socketRef.current.emit("join_conversation", conv.id);
    }
    try {
      const msgs = await messagingApi.getMessages(conv.id);
      setMessages(msgs);
    } catch (err) {
      console.error(err);
    }
  }

  async function handleSendMessage(e) {
    e.preventDefault();
    if (!newMessageText.trim() || !activeConv) return;
    try {
      const msg = await messagingApi.sendMessage(activeConv.id, {
        content: newMessageText.trim(),
        type: "TEXT",
      });
      setMessages((prev) => [...prev, msg]);
      setNewMessageText("");
      loadConversations();
    } catch (err) {
      alert(err.message || "Failed to send message.");
    }
  }

  async function handleStartDirectChat(targetUserId) {
    try {
      const conv = await messagingApi.createDirect(targetUserId);
      loadConversations(conv.id);
      setActiveTab("chats");
    } catch (err) {
      alert(err.message || "Failed to start direct conversation.");
    }
  }

  async function handleCreateGroupSubmit(e) {
    e.preventDefault();
    if (!groupName.trim()) return;
    try {
      const newGroupConv = await messagingApi.createGroup({
        name: groupName.trim(),
        description: groupDesc.trim(),
        icon: groupIcon,
        initial_member_ids: selectedFriendsForGroup,
      });
      setShowCreateGroup(false);
      setGroupName("");
      setGroupDesc("");
      setSelectedFriendsForGroup([]);
      loadConversations(newGroupConv.id);
      loadGroupsData();
      setActiveTab("chats");
    } catch (err) {
      alert(err.message || "Failed to create group.");
    }
  }

  async function handleJoinGroupRequest(groupId) {
    try {
      await messagingApi.joinGroup(groupId);
      alert("Join request sent to group admins!");
      loadGroupsData();
    } catch (err) {
      alert(err.message || "Failed to send join request.");
    }
  }

  async function handleOpenGroupMembers() {
    if (!activeConv || activeConv.type !== "group" || !activeConv.group) return;
    setShowGroupMembers(true);
    setLoadingGroupMembers(true);
    try {
      const members = await messagingApi.getGroupMembers(activeConv.group.id);
      setGroupMembers(members);
    } catch (err) {
      alert(err.message || "Failed to load group members.");
    } finally {
      setLoadingGroupMembers(false);
    }
  }

  async function handleAddMemberToGroup(memberId) {
    if (!activeConv?.group) return;
    setAddingMemberId(memberId);
    try {
      const newMember = await messagingApi.addGroupMember(activeConv.group.id, memberId);
      setGroupMembers((prev) => [...prev, newMember]);
      loadGroupsData();
    } catch (err) {
      alert(err.message || "Failed to add member.");
    } finally {
      setAddingMemberId("");
    }
  }

  async function handleLeaveCurrentGroup() {
    if (!activeConv?.group) return;
    if (!window.confirm(`Leave "${activeConv.title}"? You'll need to be re-added or request to join again to come back.`)) {
      return;
    }
    setLeavingGroup(true);
    try {
      await messagingApi.leaveGroup(activeConv.group.id);
      if (socketRef.current) {
        socketRef.current.emit("leave_conversation", activeConv.id);
      }
      setShowGroupMembers(false);
      setActiveConv(null);
      activeConvRef.current = null;
      setMessages([]);
      await loadConversations();
      loadGroupsData();
    } catch (err) {
      alert(err.message || "Failed to leave group.");
    } finally {
      setLeavingGroup(false);
    }
  }

  async function handleRespondJoinRequest(requestId, status) {
    try {
      await messagingApi.respondJoinRequest(requestId, status);
      alert(`Join request ${status}!`);
      loadGroupsData();
      loadConversations();
    } catch (err) {
      alert(err.message || "Failed to respond to request.");
    }
  }

  async function handleRespondFriendRequest(requestId, status) {
    try {
      await friendApi.respondRequest(requestId, status);
      alert(`Friend request ${status}!`);
      loadFriendsAndRequests();
      loadConversations();
    } catch (err) {
      alert(err.message || "Failed to respond to friend request.");
    }
  }

  const themeContainerClass = isDarkMode
    ? "bg-[#071612] text-[#E8F2EE]"
    : "bg-[#F8F6EF] text-[#202724]";

  const themeCardClass = isDarkMode
    ? "border border-[#6FA58D]/30 bg-[#15382E]/90 backdrop-blur-md shadow-md"
    : "border border-[#6FA58D]/25 bg-white/90 backdrop-blur-md shadow-sm";

  const themeTextPrimary = isDarkMode ? "text-[#E8F2EE]" : "text-[#202724]";
  const themeTextMuted = isDarkMode ? "text-[#9EC5B4]" : "text-[#68736E]";
  const themeInputClass = isDarkMode
    ? "border-[#6FA58D]/40 bg-[#0B201A]/80 text-[#E8F2EE] placeholder-[#9EC5B4]"
    : "border-[#6FA58D]/30 bg-[#F8F6EF] text-[#202724] placeholder-[#68736E]";

  return (
    <div className={`min-h-screen font-sans antialiased flex flex-col transition-colors duration-300 ${themeContainerClass}`}>
      {/* Header with Back to Community Button & Dark Mode Toggle */}
      <header className={`border-b ${isDarkMode ? "border-[#6FA58D]/20 bg-[#0B201A]/80" : "border-[#6FA58D]/25 bg-white/80"} backdrop-blur-md sticky top-0 z-30 transition-colors`}>
        <div className="mx-auto flex max-w-7xl items-center justify-between px-4 sm:px-6 py-4">
          <button
            onClick={() => navigate("/community")}
            className={`flex items-center gap-2 rounded-xl px-3.5 py-2 text-xs font-bold transition border ${
              isDarkMode
                ? "border-[#6FA58D]/40 bg-[#15382E] text-[#E8F2EE] hover:bg-[#1C483B]"
                : "border-[#6FA58D]/30 bg-white text-[#185C4A] hover:bg-[#F8F6EF] shadow-sm"
            }`}
            title="Back to Community"
          >
            <ArrowLeft className="h-4 w-4" />
            <span>Back to Community</span>
          </button>

          <div className="flex items-center gap-3">
            <span className="hidden sm:inline-flex items-center gap-1.5 rounded-full bg-[#185C4A]/20 px-3 py-1 text-xs font-semibold text-[#6FA58D]">
              <Sparkles className="h-3.5 w-3.5 text-[#E9785A]" /> Direct & Group Messages
            </span>

            <button
              onClick={() => setIsDarkMode(!isDarkMode)}
              className={`flex items-center gap-2 rounded-xl border p-2.5 text-xs font-bold transition ${
                isDarkMode
                  ? "border-[#6FA58D]/40 bg-[#15382E] text-[#E8F2EE] hover:bg-[#1C483B]"
                  : "border-[#6FA58D]/30 bg-white text-[#202724] hover:bg-[#F8F6EF] shadow-sm"
              }`}
              title="Toggle Community Dark Mode"
            >
              {isDarkMode ? (
                <>
                  <Sun className="h-4 w-4 text-[#E8B84A]" /> <span className="hidden sm:inline">Light Mode</span>
                </>
              ) : (
                <>
                  <Moon className="h-4 w-4 text-[#185C4A]" /> <span className="hidden sm:inline">Dark Mode</span>
                </>
              )}
            </button>
          </div>
        </div>
      </header>

      {/* Main Container */}
      <div className="mx-auto flex w-full max-w-7xl flex-1 gap-6 p-4 md:p-6">
        {/* Left Sidebar */}
        <div className={`flex w-full md:w-80 flex-col rounded-2xl ${themeCardClass} overflow-hidden`}>
          {/* Header & Tabs */}
          <div className="p-4 border-b border-[#6FA58D]/25">
            <h2 className={`text-lg font-extrabold ${themeTextPrimary} mb-3 flex items-center gap-2`}>
              <MessageCircleMore className="h-5 w-5 text-[#E9785A]" /> Messages
            </h2>
            <div className={`flex gap-1 rounded-xl p-1 border text-xs ${isDarkMode ? "bg-[#0B201A] border-[#6FA58D]/30" : "bg-[#F8F6EF] border-[#6FA58D]/25"}`}>
              <button
                onClick={() => setActiveTab("chats")}
                className={`flex-1 rounded-lg py-1.5 font-bold transition ${
                  activeTab === "chats"
                    ? "bg-[#185C4A] text-white shadow-sm"
                    : `${themeTextMuted} hover:text-[#185C4A]`
                }`}
              >
                Chats
              </button>
              <button
                onClick={() => setActiveTab("groups")}
                className={`flex-1 rounded-lg py-1.5 font-bold transition ${
                  activeTab === "groups"
                    ? "bg-[#185C4A] text-white shadow-sm"
                    : `${themeTextMuted} hover:text-[#185C4A]`
                }`}
              >
                Groups
              </button>
              <button
                onClick={() => setActiveTab("friends")}
                className={`flex-1 rounded-lg py-1.5 font-bold transition relative ${
                  activeTab === "friends"
                    ? "bg-[#185C4A] text-white shadow-sm"
                    : `${themeTextMuted} hover:text-[#185C4A]`
                }`}
              >
                Friends
                {friendRequests.length > 0 && (
                  <span className="ml-1 inline-flex h-4 w-4 items-center justify-center rounded-full bg-[#E9785A] text-[10px] font-bold text-white shadow">
                    {friendRequests.length}
                  </span>
                )}
              </button>
              {adminJoinRequests.length > 0 && (
                <button
                  onClick={() => setActiveTab("admin")}
                  className={`rounded-lg px-2 py-1.5 font-bold transition ${
                    activeTab === "admin" ? "bg-[#E8B84A] text-white" : "text-[#E8B84A] hover:opacity-80"
                  }`}
                  title="Admin Pending Requests"
                >
                  <Shield className="h-4 w-4" />
                </button>
              )}
            </div>
          </div>

          {/* List Area */}
          <div className="flex-1 overflow-y-auto p-2 space-y-1">
            {activeTab === "chats" && (
              <>
                {conversations.length === 0 ? (
                  <p className={`text-center text-xs ${themeTextMuted} py-8`}>No conversations yet.</p>
                ) : (
                  conversations.map((conv) => (
                    <button
                      key={conv.id}
                      onClick={() => selectConversation(conv)}
                      className={`flex w-full items-center gap-3 rounded-xl p-3 text-left transition ${
                        activeConv?.id === conv.id
                          ? "bg-[#185C4A]/20 border border-[#185C4A]/40 font-bold shadow-sm"
                          : `hover:${isDarkMode ? "bg-[#0B201A]" : "bg-[#F8F6EF]"}`
                      }`}
                    >
                      {conv.type === "group" ? (
                        <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-[#185C4A]/20 text-[#6FA58D] border border-[#6FA58D]/30 font-bold">
                          {conv.group?.icon || "👥"}
                        </div>
                      ) : (
                        <img
                          src={
                            conv.targetUser?.avatar ||
                            `https://api.dicebear.com/7.x/avataaars/svg?seed=${conv.targetUser?.id || "user"}`
                          }
                          alt={conv.title}
                          className="h-10 w-10 rounded-full border border-[#6FA58D]/30 object-cover shrink-0"
                        />
                      )}
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center justify-between">
                          <h4 className={`font-bold text-sm truncate ${themeTextPrimary}`}>{conv.title}</h4>
                        </div>
                        <p className={`text-xs ${themeTextMuted} truncate mt-0.5`}>
                          {conv.lastMessage?.content || "No messages yet"}
                        </p>
                      </div>
                    </button>
                  ))
                )}
              </>
            )}

            {activeTab === "groups" && (
              <div className="space-y-4 p-2">
                <button
                  onClick={() => setShowCreateGroup(true)}
                  className="flex w-full items-center justify-center gap-2 rounded-xl bg-[#185C4A]/15 py-2.5 text-xs font-bold text-[#185C4A] dark:text-[#6FA58D] border border-[#6FA58D]/30 hover:bg-[#185C4A]/25 transition"
                >
                  <Plus className="h-4 w-4" /> Create New Group
                </button>

                <h4 className="text-xs font-bold text-[#6FA58D] uppercase tracking-wider">Discover Groups</h4>
                {allGroups.map((g) => (
                  <div key={g.id} className={`rounded-xl border border-[#6FA58D]/30 p-3 ${isDarkMode ? "bg-[#0B201A]" : "bg-[#F8F6EF]"}`}>
                    <div className="flex items-center gap-3 mb-2">
                      <span className="text-2xl">{g.icon || "👥"}</span>
                      <div className="flex-1">
                        <h4 className={`font-bold text-sm ${themeTextPrimary}`}>{g.name}</h4>
                        <p className={`text-xs ${themeTextMuted}`}>{g.memberCount} Members</p>
                      </div>
                    </div>
                    {g.description && <p className={`text-xs ${themeTextMuted} mb-3`}>{g.description}</p>}

                    {g.isMember ? (
                      <span className="inline-block rounded-lg bg-[#6FA58D]/20 px-3 py-1 text-xs text-[#6FA58D] font-bold">
                        ✓ Member
                      </span>
                    ) : g.isPending ? (
                      <span className="inline-block rounded-lg bg-[#E8B84A]/20 px-3 py-1 text-xs text-[#E8B84A] font-bold">
                        ⏳ Pending Approval
                      </span>
                    ) : (
                      <button
                        onClick={() => handleJoinGroupRequest(g.id)}
                        className="w-full rounded-lg bg-[#185C4A] py-1.5 text-xs font-bold text-white hover:bg-[#124739] transition"
                      >
                        Request to Join
                      </button>
                    )}
                  </div>
                ))}
              </div>
            )}

            {activeTab === "friends" && (
              <div className="space-y-4 p-2">
                {/* Pending Requests */}
                {friendRequests.length > 0 && (
                  <div>
                    <h4 className="text-xs font-bold text-[#E9785A] uppercase tracking-wider mb-2">
                      Friend Requests ({friendRequests.length})
                    </h4>
                    <div className="space-y-2">
                      {friendRequests.map((req) => (
                        <div key={req.id} className={`rounded-xl border border-[#E9785A]/30 p-3 ${isDarkMode ? "bg-[#0B201A]" : "bg-[#F8F6EF]"}`}>
                          <p className={`text-xs font-bold mb-2 ${themeTextPrimary}`}>{req.sender?.name} wants to connect</p>
                          <div className="flex gap-2">
                            <button
                              onClick={() => handleRespondFriendRequest(req.id, "accepted")}
                              className="flex-1 rounded-lg bg-[#185C4A] py-1 text-xs font-bold text-white hover:bg-[#124739] transition"
                            >
                              Accept
                            </button>
                            <button
                              onClick={() => handleRespondFriendRequest(req.id, "rejected")}
                              className={`flex-1 rounded-lg border border-[#6FA58D]/30 py-1 text-xs font-bold ${themeTextMuted}`}
                            >
                              Reject
                            </button>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                {/* Friends List */}
                <h4 className="text-xs font-bold text-[#6FA58D] uppercase tracking-wider">Your Friends</h4>
                {friends.length === 0 ? (
                  <p className={`text-xs ${themeTextMuted} py-4 text-center`}>No friends added yet.</p>
                ) : (
                  friends.map((f) => (
                    <div key={f.id} className={`flex items-center justify-between rounded-xl p-3 border border-[#6FA58D]/25 ${isDarkMode ? "bg-[#0B201A]" : "bg-[#F8F6EF]"}`}>
                      <div className="flex items-center gap-3">
                        <img
                          src={f.avatar || `https://api.dicebear.com/7.x/avataaars/svg?seed=${f.id}`}
                          alt={f.name}
                          className="h-8 w-8 rounded-full object-cover border border-[#6FA58D]/30"
                        />
                        <span className={`text-xs font-bold ${themeTextPrimary}`}>{f.name}</span>
                      </div>
                      <button
                        onClick={() => handleStartDirectChat(f.id)}
                        className="rounded-lg bg-[#185C4A]/15 px-3 py-1 text-xs text-[#185C4A] dark:text-[#6FA58D] font-bold hover:bg-[#185C4A]/25 transition"
                      >
                        Message
                      </button>
                    </div>
                  ))
                )}
              </div>
            )}

            {activeTab === "admin" && (
              <div className="space-y-3 p-2">
                <h4 className="text-xs font-bold text-[#E8B84A] uppercase tracking-wider mb-2">
                  Group Join Requests ({adminJoinRequests.length})
                </h4>
                {adminJoinRequests.length === 0 ? (
                  <p className={`text-xs ${themeTextMuted} py-4 text-center`}>No pending join requests.</p>
                ) : (
                  adminJoinRequests.map((req) => (
                    <div key={req.id} className={`rounded-xl border border-[#6FA58D]/30 p-3 ${isDarkMode ? "bg-[#0B201A]" : "bg-[#F8F6EF]"}`}>
                      <p className={`text-xs font-bold ${themeTextPrimary}`}>{req.user?.name}</p>
                      <p className={`text-xs ${themeTextMuted} mb-3`}>Wants to join: <span className="text-[#6FA58D] font-bold">{req.groupName}</span></p>
                      <div className="flex gap-2">
                        <button
                          onClick={() => handleRespondJoinRequest(req.id, "approved")}
                          className="flex-1 rounded-lg bg-[#185C4A] py-1 text-xs font-bold text-white hover:bg-[#124739] transition"
                        >
                          Approve
                        </button>
                        <button
                          onClick={() => handleRespondJoinRequest(req.id, "rejected")}
                          className="flex-1 rounded-lg bg-[#E9785A]/15 text-[#E9785A] py-1 text-xs font-bold hover:bg-[#E9785A]/25 transition"
                        >
                          Reject
                        </button>
                      </div>
                    </div>
                  ))
                )}
              </div>
            )}
          </div>
        </div>

        {/* Right Main Chat Container */}
        <div className={`hidden md:flex flex-1 flex-col rounded-2xl ${themeCardClass} overflow-hidden`}>
          {activeConv ? (
            <>
              {/* Chat Header */}
              <div className={`flex items-center justify-between border-b border-[#6FA58D]/25 p-4 ${isDarkMode ? "bg-[#0B201A]/80" : "bg-white/80"}`}>
                <div className="flex items-center gap-3">
                  {activeConv.type === "group" ? (
                    <div className="flex h-10 w-10 items-center justify-center rounded-full bg-[#185C4A]/20 text-[#6FA58D] border border-[#6FA58D]/30 font-bold">
                      {activeConv.group?.icon || "👥"}
                    </div>
                  ) : (
                    <img
                      src={
                        activeConv.targetUser?.avatar ||
                        `https://api.dicebear.com/7.x/avataaars/svg?seed=${activeConv.targetUser?.id || "user"}`
                      }
                      alt={activeConv.title}
                      className="h-10 w-10 rounded-full border border-[#6FA58D]/30 object-cover"
                    />
                  )}
                  <div>
                    <h3 className={`font-bold text-base ${themeTextPrimary}`}>{activeConv.title}</h3>
                    {activeConv.type === "group" ? (
                      <p className={`text-xs ${themeTextMuted}`}>Group Chat</p>
                    ) : (
                      activeConv.targetUser?.role === "teacher" && (
                        <span className="text-xs font-bold text-[#E8B84A]">Instructor</span>
                      )
                    )}
                  </div>
                </div>

                {activeConv.type === "group" && (
                  <div className="flex items-center gap-2">
                    <button
                      onClick={handleOpenGroupMembers}
                      className={`flex items-center gap-1.5 rounded-lg px-3 py-1.5 text-xs font-semibold transition ${isDarkMode ? "bg-[#6FA58D]/20 text-[#6FA58D] hover:bg-[#6FA58D]/30" : "bg-[#6FA58D]/15 text-[#185C4A] hover:bg-[#6FA58D]/25"}`}
                    >
                      <Users className="h-3.5 w-3.5" /> Members
                    </button>
                    <button
                      onClick={handleLeaveCurrentGroup}
                      disabled={leavingGroup}
                      className="flex items-center gap-1.5 rounded-lg bg-[#E9785A]/15 px-3 py-1.5 text-xs font-semibold text-[#E9785A] hover:bg-[#E9785A]/25 transition disabled:opacity-50"
                    >
                      <LogOut className="h-3.5 w-3.5" /> {leavingGroup ? "Leaving..." : "Leave"}
                    </button>
                  </div>
                )}
              </div>

              {/* Messages Feed */}
              <div className={`flex-1 overflow-y-auto p-6 space-y-4 ${isDarkMode ? "bg-[#071612]/50" : "bg-[#F8F6EF]/50"}`}>
                {messages.length === 0 ? (
                  <p className={`text-center text-xs ${themeTextMuted} py-12`}>No messages yet. Send a message to get started!</p>
                ) : (
                  messages.map((m) => {
                    const isMe = m.sender_id === currentUser?.id;
                    const meta = m.metadata ? (typeof m.metadata === "string" ? JSON.parse(m.metadata) : m.metadata) : null;

                    return (
                      <div key={m.id} className={`flex items-start gap-3 ${isMe ? "flex-row-reverse" : "flex-row"}`}>
                        <img
                          src={m.sender?.avatar || `https://api.dicebear.com/7.x/avataaars/svg?seed=${m.sender_id}`}
                          alt={m.sender?.name}
                          className="h-8 w-8 rounded-full border border-[#6FA58D]/30 object-cover shrink-0 mt-1"
                        />
                        <div className={`max-w-md ${isMe ? "items-end" : "items-start"}`}>
                          <span className={`text-[10px] ${themeTextMuted} block mb-1 ${isMe ? "text-right" : "text-left"}`}>
                            {m.sender?.name || "User"} • {new Date(m.created_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                          </span>

                          {m.type === "POST_SHARE" && meta ? (
                            <div className={`rounded-2xl border border-[#6FA58D]/40 p-4 text-left shadow-md ${isDarkMode ? "bg-[#0B201A]" : "bg-white"}`}>
                              <span className="text-xs font-bold text-[#E9785A] uppercase tracking-wider flex items-center gap-1 mb-2">
                                <Share2 className="h-3.5 w-3.5" /> Shared Community Post
                              </span>
                              <p className={`text-sm font-bold ${themeTextPrimary} mb-1`}>By {meta.postAuthor || "User"}</p>
                              <p className={`text-xs ${themeTextMuted} line-clamp-3 mb-3`}>{meta.snippet}</p>
                              <Link
                                to={`/community/post/${meta.postId}`}
                                className="inline-flex items-center gap-1.5 rounded-xl bg-[#185C4A] px-3.5 py-1.5 text-xs font-bold text-white hover:bg-[#124739] transition"
                              >
                                View Post <ExternalLink className="h-3 w-3" />
                              </Link>
                            </div>
                          ) : m.type === "COURSE_SHARE" && meta ? (
                            <div className={`rounded-2xl border border-[#6FA58D]/40 p-4 text-left shadow-md ${isDarkMode ? "bg-[#0B201A]" : "bg-white"}`}>
                              <span className="text-xs font-bold text-[#E8B84A] uppercase tracking-wider flex items-center gap-1 mb-2">
                                🎓 Shared Course
                              </span>
                              <p className={`text-sm font-bold ${themeTextPrimary} mb-1`}>{meta.courseTitle}</p>
                              <p className={`text-xs ${themeTextMuted} mb-3`}>Instructor: {meta.instructor || "Teacher"}</p>
                              <Link
                                to={`/explore/${meta.courseId}`}
                                className="inline-flex items-center gap-1.5 rounded-xl bg-[#185C4A] px-3.5 py-1.5 text-xs font-bold text-white hover:bg-[#124739] transition"
                              >
                                View Course <ExternalLink className="h-3 w-3" />
                              </Link>
                            </div>
                          ) : (
                            <div
                              className={`rounded-2xl px-4 py-2.5 text-sm leading-relaxed ${
                                isMe
                                  ? "bg-[#185C4A] text-white shadow-sm"
                                  : isDarkMode
                                  ? "bg-[#0B201A] text-[#E8F2EE] border border-[#6FA58D]/30"
                                  : "bg-white text-[#202724] border border-[#6FA58D]/30 shadow-sm"
                              }`}
                            >
                              {m.content}
                            </div>
                          )}
                        </div>
                      </div>
                    );
                  })
                )}
                <div ref={messagesEndRef} />
              </div>

              {/* Message Input Form */}
              <form onSubmit={handleSendMessage} className={`p-4 border-t border-[#6FA58D]/25 flex gap-3 ${isDarkMode ? "bg-[#0B201A]/80" : "bg-white/80"}`}>
                <input
                  type="text"
                  placeholder="Type a message..."
                  value={newMessageText}
                  onChange={(e) => setNewMessageText(e.target.value)}
                  className={`flex-1 rounded-xl border px-4 py-3 text-sm focus:border-[#185C4A] focus:outline-none transition ${themeInputClass}`}
                />
                <button
                  type="submit"
                  disabled={!newMessageText.trim()}
                  className="flex items-center justify-center rounded-xl bg-[#185C4A] px-5 py-3 font-bold text-white hover:bg-[#124739] disabled:opacity-50 transition shadow-sm"
                >
                  <Send className="h-4 w-4" />
                </button>
              </form>
            </>
          ) : (
            <div className={`flex flex-1 items-center justify-center text-center p-8 text-xs font-semibold ${themeTextMuted}`}>
              Select a chat or group conversation to start messaging.
            </div>
          )}
        </div>
      </div>

      {/* Create Group Modal */}
      {showCreateGroup && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4">
          <div className={`w-full max-w-md rounded-2xl border border-[#6FA58D]/30 p-6 shadow-2xl ${isDarkMode ? "bg-[#0B201A] text-[#E8F2EE]" : "bg-[#F8F6EF] text-[#202724]"}`}>
            <div className="flex items-center justify-between mb-4 border-b border-[#6FA58D]/25 pb-3">
              <h3 className="text-base font-extrabold flex items-center gap-2 text-[#185C4A] dark:text-[#6FA58D]">
                <Users className="h-5 w-5 text-[#E9785A]" /> Create Chat Group
              </h3>
              <button onClick={() => setShowCreateGroup(false)} className="text-[#68736E] hover:text-[#202724]">
                <X className="h-5 w-5" />
              </button>
            </div>
            <form onSubmit={handleCreateGroupSubmit} className="space-y-4">
              <div>
                <label className="block text-xs font-bold mb-1">Group Icon (Emoji)</label>
                <input
                  type="text"
                  value={groupIcon}
                  onChange={(e) => setGroupIcon(e.target.value)}
                  className={`w-16 rounded-xl border p-2 text-center text-lg focus:border-[#185C4A] focus:outline-none transition ${themeInputClass}`}
                />
              </div>

              <div>
                <label className="block text-xs font-bold mb-1">Group Name</label>
                <input
                  type="text"
                  required
                  placeholder="e.g. Physics Study Group"
                  value={groupName}
                  onChange={(e) => setGroupName(e.target.value)}
                  className={`w-full rounded-xl border p-3 text-sm focus:border-[#185C4A] focus:outline-none transition ${themeInputClass}`}
                />
              </div>

              <div>
                <label className="block text-xs font-bold mb-1">Description</label>
                <textarea
                  placeholder="What is this group about?"
                  value={groupDesc}
                  onChange={(e) => setGroupDesc(e.target.value)}
                  className={`w-full rounded-xl border p-3 text-sm focus:border-[#185C4A] focus:outline-none transition ${themeInputClass}`}
                  rows={3}
                />
              </div>

              {/* Invite Friends */}
              {friends.length > 0 && (
                <div>
                  <label className="block text-xs font-bold mb-1.5">Invite Friends</label>
                  <div className={`max-h-36 overflow-y-auto space-y-2 border rounded-xl p-2.5 ${themeInputClass}`}>
                    {friends.map((f) => {
                      const isSelected = selectedFriendsForGroup.includes(f.id);
                      return (
                        <label key={f.id} className={`flex items-center gap-3 p-2 rounded-lg cursor-pointer transition ${isDarkMode ? "hover:bg-[#15382E]" : "hover:bg-white"}`}>
                          <input
                            type="checkbox"
                            checked={isSelected}
                            onChange={(e) => {
                              if (e.target.checked) {
                                setSelectedFriendsForGroup((prev) => [...prev, f.id]);
                              } else {
                                setSelectedFriendsForGroup((prev) => prev.filter((id) => id !== f.id));
                              }
                            }}
                            className="rounded border-[#6FA58D] text-[#185C4A] focus:ring-0"
                          />
                          <span className={`text-xs font-bold ${themeTextPrimary}`}>{f.name}</span>
                        </label>
                      );
                    })}
                  </div>
                </div>
              )}

              <div className="flex gap-3 pt-2 border-t border-[#6FA58D]/25">
                <button
                  type="button"
                  onClick={() => setShowCreateGroup(false)}
                  className={`flex-1 rounded-xl border border-[#6FA58D]/30 py-2.5 text-xs font-bold transition ${themeTextMuted} hover:text-[#202724]`}
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={!groupName.trim()}
                  className="flex-1 rounded-xl bg-[#185C4A] py-2.5 text-xs font-bold text-white hover:bg-[#124739] disabled:opacity-50 transition shadow-sm"
                >
                  Create Group
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {showGroupMembers && activeConv?.group && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4">
          <div className={`w-full max-w-md rounded-2xl border border-[#6FA58D]/30 p-6 shadow-2xl ${isDarkMode ? "bg-[#0B201A] text-[#E8F2EE]" : "bg-[#F8F6EF] text-[#202724]"}`}>
            <div className="flex items-center justify-between mb-4 border-b border-[#6FA58D]/25 pb-3">
              <h3 className="text-base font-extrabold flex items-center gap-2 text-[#185C4A] dark:text-[#6FA58D]">
                <Users className="h-5 w-5 text-[#E9785A]" /> {activeConv.title} Members
              </h3>
              <button onClick={() => setShowGroupMembers(false)} className="text-[#68736E] hover:text-[#202724]">
                <X className="h-5 w-5" />
              </button>
            </div>

            {loadingGroupMembers ? (
              <p className={`text-xs ${themeTextMuted} py-4 text-center`}>Loading members...</p>
            ) : (
              <div className="space-y-2 max-h-56 overflow-y-auto mb-4">
                {groupMembers.map((m) => (
                  <div key={m.id} className={`flex items-center gap-3 rounded-xl border border-[#6FA58D]/20 p-2.5 ${isDarkMode ? "bg-[#15382E]/40" : "bg-white"}`}>
                    <img
                      src={m.avatar || `https://api.dicebear.com/7.x/avataaars/svg?seed=${m.id}`}
                      alt={m.name}
                      className="h-8 w-8 rounded-full border border-[#6FA58D]/30 object-cover"
                    />
                    <span className={`flex-1 text-xs font-bold ${themeTextPrimary}`}>{m.name}</span>
                    {m.id === activeConv.group.admin_id && (
                      <span className="text-[10px] font-bold uppercase tracking-wide text-[#E8B84A]">Admin</span>
                    )}
                  </div>
                ))}
              </div>
            )}

            {currentUser?.id === activeConv.group.admin_id && (
              <div className="border-t border-[#6FA58D]/25 pt-3">
                <h4 className="text-xs font-bold text-[#6FA58D] uppercase tracking-wider mb-2">Add a Friend</h4>
                {friends.filter((f) => !groupMembers.some((m) => m.id === f.id)).length === 0 ? (
                  <p className={`text-xs ${themeTextMuted}`}>All your friends are already in this group.</p>
                ) : (
                  <div className="space-y-2 max-h-40 overflow-y-auto">
                    {friends
                      .filter((f) => !groupMembers.some((m) => m.id === f.id))
                      .map((f) => (
                        <div key={f.id} className="flex items-center gap-3">
                          <img
                            src={f.avatar || `https://api.dicebear.com/7.x/avataaars/svg?seed=${f.id}`}
                            alt={f.name}
                            className="h-7 w-7 rounded-full border border-[#6FA58D]/30 object-cover"
                          />
                          <span className={`flex-1 text-xs font-bold ${themeTextPrimary}`}>{f.name}</span>
                          <button
                            onClick={() => handleAddMemberToGroup(f.id)}
                            disabled={addingMemberId === f.id}
                            className="flex items-center gap-1 rounded-lg bg-[#185C4A] px-2.5 py-1 text-[11px] font-bold text-white hover:bg-[#124739] transition disabled:opacity-50"
                          >
                            <UserPlus className="h-3 w-3" /> {addingMemberId === f.id ? "Adding..." : "Add"}
                          </button>
                        </div>
                      ))}
                  </div>
                )}
              </div>
            )}

            <button
              onClick={handleLeaveCurrentGroup}
              disabled={leavingGroup}
              className="mt-5 w-full flex items-center justify-center gap-2 rounded-xl bg-[#E9785A]/15 text-[#E9785A] py-2.5 text-xs font-bold hover:bg-[#E9785A]/25 transition disabled:opacity-50"
            >
              <LogOut className="h-4 w-4" /> {leavingGroup ? "Leaving..." : "Leave Group"}
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
