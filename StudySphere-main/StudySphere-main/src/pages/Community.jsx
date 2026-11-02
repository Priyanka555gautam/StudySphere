import React, { useState, useEffect } from "react";
import { Link, useNavigate } from "react-router-dom";
import { communityApi, friendApi, messagingApi, authApi } from "../lib/api";
import {
  MessageSquare,
  Bookmark,
  Share2,
  Image,
  Video,
  Send,
  UserPlus,
  UserCheck,
  Clock,
  Copy,
  Check,
  Users,
  Sparkles,
  Search,
  MessageCircle,
  X,
  ChevronRight,
  Sun,
  Moon,
  MessageCircleMore,
  Pencil,
  Trash2
} from "lucide-react";

export default function Community() {
  const navigate = useNavigate();

  const [currentUser, setCurrentUser] = useState(null);
  const [posts, setPosts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState("all"); // 'all' | 'saved'

  // Dark mode state (strictly scoped to Community)
  const [isDarkMode, setIsDarkMode] = useState(() => {
    return localStorage.getItem("community_dark_mode") === "true";
  });

  // Search state for finding posts and people
  const [searchQuery, setSearchQuery] = useState("");

  // Post creation state
  const [content, setContent] = useState("");
  const [mediaUrl, setMediaUrl] = useState("");
  const [mediaType, setMediaType] = useState("image"); // 'image' | 'video'
  const [showMediaInput, setShowMediaInput] = useState(false);
  const [posting, setPosting] = useState(false);
  const [mediaFileName, setMediaFileName] = useState("");
  const [processingMedia, setProcessingMedia] = useState(false);

  // Share modal state
  const [sharePost, setSharePost] = useState(null);
  const [conversations, setConversations] = useState([]);
  const [selectedConv, setSelectedConv] = useState("");
  const [copiedLink, setCopiedLink] = useState(false);
  const [sharing, setSharing] = useState(false);

  // Sidebar Data State (Friends & Messages)
  const [friendRequests, setFriendRequests] = useState([]);
  const [friendSuggestions, setFriendSuggestions] = useState([]);
  const [topChats, setTopChats] = useState([]);
  const [requestedUserIds, setRequestedUserIds] = useState(new Set());
  const [friendStatuses, setFriendStatuses] = useState({});

  // Mobile/Side Drawer State
  const [sidebarOpen, setSidebarOpen] = useState(false);

  // Edit & Delete Post State
  const [editingPost, setEditingPost] = useState(null);
  const [editContent, setEditContent] = useState("");
  const [editMediaUrl, setEditMediaUrl] = useState("");
  const [editMediaType, setEditMediaType] = useState("");
  const [isSubmittingEdit, setIsSubmittingEdit] = useState(false);
  const [editMediaFileName, setEditMediaFileName] = useState("");
  const [editProcessingMedia, setEditProcessingMedia] = useState(false);

  const [deletingPostId, setDeletingPostId] = useState(null);
  const [isSubmittingDelete, setIsSubmittingDelete] = useState(false);

  useEffect(() => {
    localStorage.setItem("community_dark_mode", isDarkMode);
  }, [isDarkMode]);

  useEffect(() => {
    fetchUserAndCommunityData();
  }, [activeTab]);

  async function fetchUserAndCommunityData() {
    setLoading(true);
    try {
      const { user } = await authApi.me().catch(() => ({ user: null }));
      setCurrentUser(user);

      // Load feed posts
      let fetchedPosts = [];
      if (activeTab === "saved") {
        fetchedPosts = await communityApi.savedPosts();
      } else if (activeTab === "my-posts") {
        fetchedPosts = await communityApi.myPosts();
      } else {
        fetchedPosts = await communityApi.listPosts();
      }
      setPosts(fetchedPosts);

      if (user) {
        // Load Friend Requests
        const reqs = await friendApi.getRequests().catch(() => []);
        setFriendRequests(reqs);

        // Load Friend Suggestions
        const suggs = await friendApi.getSuggestions().catch(() => []);
        setFriendSuggestions(suggs);

        // Load Recent Conversations for Top Chats
        const convs = await messagingApi.getConversations().catch(() => []);
        setTopChats(convs);

        // Check friendship statuses for post authors
        const statuses = {};
        for (const p of fetchedPosts) {
          if (p.author && p.author.id !== user.id && p.author.role === "student") {
            try {
              const res = await friendApi.getStatus(p.author.id);
              statuses[p.author.id] = res.status;
            } catch (err) {
              console.error(err);
            }
          }
        }
        setFriendStatuses(statuses);
      }
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  }

  const MAX_IMAGE_BYTES = 4 * 1024 * 1024; // 4MB
  const MAX_VIDEO_BYTES = 8 * 1024 * 1024; // 8MB — kept small because it's stored as base64 in a MongoDB document (16MB hard limit per document)

  function readFileAsDataUrl(file) {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.onload = () => resolve(String(reader.result));
      reader.onerror = () => reject(new Error("Could not read the selected file."));
      reader.readAsDataURL(file);
    });
  }

  async function handleMediaFileChange(e) {
    const file = e.target.files?.[0];
    e.target.value = ""; // allow re-selecting the same file later
    if (!file) return;

    const isImage = file.type.startsWith("image/");
    const isVideo = file.type.startsWith("video/");
    if (!isImage && !isVideo) {
      alert("Please choose an image or video file.");
      return;
    }

    const limit = isVideo ? MAX_VIDEO_BYTES : MAX_IMAGE_BYTES;
    if (file.size > limit) {
      alert(`That file is too large. Please choose ${isVideo ? "a video under 8MB" : "an image under 4MB"}.`);
      return;
    }

    setProcessingMedia(true);
    try {
      const dataUrl = await readFileAsDataUrl(file);
      setMediaUrl(dataUrl);
      setMediaType(isVideo ? "video" : "image");
      setMediaFileName(file.name);
      setShowMediaInput(true);
    } catch (err) {
      alert(err.message || "Failed to load the selected file.");
    } finally {
      setProcessingMedia(false);
    }
  }

  async function handleEditMediaFileChange(e) {
    const file = e.target.files?.[0];
    e.target.value = "";
    if (!file) return;

    const isImage = file.type.startsWith("image/");
    const isVideo = file.type.startsWith("video/");
    if (!isImage && !isVideo) {
      alert("Please choose an image or video file.");
      return;
    }

    const limit = isVideo ? MAX_VIDEO_BYTES : MAX_IMAGE_BYTES;
    if (file.size > limit) {
      alert(`That file is too large. Please choose ${isVideo ? "a video under 8MB" : "an image under 4MB"}.`);
      return;
    }

    setEditProcessingMedia(true);
    try {
      const dataUrl = await readFileAsDataUrl(file);
      setEditMediaUrl(dataUrl);
      setEditMediaType(isVideo ? "video" : "image");
      setEditMediaFileName(file.name);
    } catch (err) {
      alert(err.message || "Failed to load the selected file.");
    } finally {
      setEditProcessingMedia(false);
    }
  }

  async function handleCreatePost(e) {
    e.preventDefault();
    if (!content.trim() && !mediaUrl.trim()) {
      alert("Please add text content or a photo/video to your post.");
      return;
    }
    setPosting(true);
    try {
      const newPost = await communityApi.createPost({
        content: content.trim(),
        media_url: mediaUrl.trim() || null,
        media_type: mediaUrl.trim() ? mediaType : null,
      });
      setPosts((prev) => [newPost, ...prev]);
      setContent("");
      setMediaUrl("");
      setMediaFileName("");
      setShowMediaInput(false);
    } catch (err) {
      alert(err.message || "Failed to create post.");
    } finally {
      setPosting(false);
    }
  }

  function handleOpenEdit(post) {
    setEditingPost(post);
    setEditContent(post.content || "");
    setEditMediaUrl(post.media_url || "");
    setEditMediaType(post.media_type || "");
    setEditMediaFileName("");
  }

  async function handleSaveEdit(e) {
    e.preventDefault();
    if (!editingPost) return;
    if (!editContent.trim() && !editMediaUrl) {
      alert("Post cannot be empty.");
      return;
    }
    setIsSubmittingEdit(true);
    try {
      const updated = await communityApi.updatePost(editingPost.id, {
        content: editContent.trim(),
        media_url: editMediaUrl || null,
        media_type: editMediaType || null,
      });
      setPosts((prev) => prev.map((p) => (p.id === editingPost.id ? updated : p)));
      setEditingPost(null);
    } catch (err) {
      console.error(err);
      alert(err.message || "Failed to update post.");
    } finally {
      setIsSubmittingEdit(false);
    }
  }

  async function handleDeletePost(postId) {
    setIsSubmittingDelete(true);
    try {
      await communityApi.deletePost(postId);
      setPosts((prev) => prev.filter((p) => p.id !== postId));
      setDeletingPostId(null);
    } catch (err) {
      console.error(err);
      alert(err.message || "Failed to delete post.");
    } finally {
      setIsSubmittingDelete(false);
    }
  }

  async function handleToggleSave(postId) {
    if (!currentUser) {
      alert("Please log in to save posts.");
      return;
    }
    try {
      const res = await communityApi.toggleSave(postId);
      setPosts((prev) =>
        prev.map((p) => (p.id === postId ? { ...p, isSaved: res.isSaved } : p))
      );
    } catch (err) {
      alert(err.message || "Failed to save post.");
    }
  }

  async function handleSendFriendRequest(targetUserId) {
    if (!currentUser) {
      alert("Please log in to send friend requests.");
      return;
    }
    try {
      await friendApi.sendRequest(targetUserId);
      setRequestedUserIds((prev) => new Set(prev).add(targetUserId));
      setFriendStatuses((prev) => ({ ...prev, [targetUserId]: "pending_sent" }));
    } catch (err) {
      alert(err.message || "Failed to send friend request.");
    }
  }

  async function handleRespondFriendRequest(requestId, status) {
    try {
      await friendApi.respondRequest(requestId, status);
      fetchUserAndCommunityData();
    } catch (err) {
      alert(err.message || "Failed to respond to friend request.");
    }
  }

  async function handleOpenShare(post) {
    setSharePost(post);
    try {
      const convs = await messagingApi.getConversations();
      setConversations(convs);
    } catch (err) {
      console.error(err);
    }
  }

  function handleCopyLink() {
    if (!sharePost) return;
    const link = `${window.location.origin}/community/post/${sharePost.id}`;
    navigator.clipboard.writeText(link);
    setCopiedLink(true);
    setTimeout(() => setCopiedLink(false), 2000);
  }

  async function handleShareInChat() {
    if (!selectedConv || !sharePost) return;
    setSharing(true);
    try {
      await messagingApi.sendMessage(selectedConv, {
        type: "POST_SHARE",
        content: `Shared a community post: "${sharePost.content ? sharePost.content.slice(0, 50) + "..." : "Media post"}"`,
        metadata: {
          postId: sharePost.id,
          postAuthor: sharePost.author?.name || "Author",
          snippet: sharePost.content || "Media post",
        },
      });
      alert("Post shared in chat!");
      setSharePost(null);
    } catch (err) {
      alert(err.message || "Failed to share in chat.");
    } finally {
      setSharing(false);
    }
  }

  // Filtered Posts by Search Query
  const filteredPosts = posts.filter((post) => {
    if (!searchQuery.trim()) return true;
    const query = searchQuery.toLowerCase();
    const contentMatch = post.content && post.content.toLowerCase().includes(query);
    const authorMatch = post.author && post.author.name && post.author.name.toLowerCase().includes(query);
    return contentMatch || authorMatch;
  });

  // Filtered Friend Suggestions by Search Query
  const filteredSuggestions = friendSuggestions.filter((sugg) => {
    if (!searchQuery.trim()) return true;
    const query = searchQuery.toLowerCase();
    const nameMatch = sugg.name && sugg.name.toLowerCase().includes(query);
    const classMatch = sugg.student_class && sugg.student_class.toLowerCase().includes(query);
    const expMatch = sugg.expertise && sugg.expertise.toLowerCase().includes(query);
    return nameMatch || classMatch || expMatch;
  });

  // Scoped theme styles
  const themeContainerClass = isDarkMode
    ? "bg-[#0B201A] text-[#E8F2EE]"
    : "bg-[#F8F6EF] text-[#202724]";

  const themeHeaderClass = isDarkMode
    ? "border-[#6FA58D]/25 bg-[#0F2C24]/80 backdrop-blur-md"
    : "border-[#6FA58D]/20 bg-white/70 backdrop-blur-md";

  const themeCardClass = isDarkMode
    ? "border border-[#6FA58D]/30 bg-[#15382E]/90 backdrop-blur-md shadow-md"
    : "border border-[#6FA58D]/25 bg-white/90 backdrop-blur-md shadow-sm";

  const themeTextPrimary = isDarkMode ? "text-[#E8F2EE]" : "text-[#202724]";
  const themeTextMuted = isDarkMode ? "text-[#9EC5B4]" : "text-[#68736E]";
  const themeInputClass = isDarkMode
    ? "border-[#6FA58D]/40 bg-[#0B201A]/80 text-[#E8F2EE] placeholder-[#9EC5B4]"
    : "border-[#6FA58D]/30 bg-[#F8F6EF]/60 text-[#202724] placeholder-[#68736E]";

  return (
    <div className={`min-h-screen font-sans antialiased transition-colors duration-300 ${themeContainerClass}`}>
      {/* Community Header Banner with Search Bar & Dark Mode Toggle */}
      <header className={`border-b ${themeHeaderClass}`}>
        <div className="mx-auto max-w-7xl px-6 py-8 flex flex-col gap-6">
          <div className="flex items-center justify-between gap-4">
            <div>
              <span className="inline-flex items-center gap-2 rounded-full bg-[#185C4A]/20 px-3.5 py-1 text-xs font-semibold text-[#6FA58D]">
                <Sparkles className="h-3.5 w-3.5 text-[#E9785A]" /> StudySphere Social Hub
              </span>
              <h1 className={`mt-2 text-3xl font-extrabold md:text-4xl tracking-tight ${themeTextPrimary}`}>
                Community Space
              </h1>
            </div>

            {/* Dark Mode Toggle */}
            <div className="flex items-center gap-3">
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
                    <Sun className="h-4 w-4 text-[#E8B84A]" /> Light Mode
                  </>
                ) : (
                  <>
                    <Moon className="h-4 w-4 text-[#185C4A]" /> Dark Mode
                  </>
                )}
              </button>
            </div>
          </div>

          {/* Search Bar & Messages Button for Posts & People */}
          <div className="flex items-center gap-3 w-full max-w-2xl">
            <div className="relative flex-1">
              <Search className={`absolute left-4 top-3.5 h-4 w-4 ${themeTextMuted}`} />
              <input
                type="text"
                placeholder="Search posts, topics, or people (name, class, expertise)..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className={`w-full rounded-2xl border pl-11 pr-4 py-3 text-sm focus:border-[#185C4A] focus:outline-none transition ${themeInputClass}`}
              />
              {searchQuery && (
                <button
                  onClick={() => setSearchQuery("")}
                  className="absolute right-3.5 top-3.5 text-xs text-[#68736E] hover:text-[#202724]"
                >
                  <X className="h-4 w-4" />
                </button>
              )}
            </div>
            <button
              onClick={() => navigate("/messages")}
              className={`flex items-center gap-2 rounded-2xl border px-4 py-3 text-xs font-bold transition shadow-sm ${
                isDarkMode
                  ? "border-[#6FA58D]/40 bg-[#15382E] text-[#E8F2EE] hover:bg-[#1C483B]"
                  : "border-[#6FA58D]/30 bg-white text-[#185C4A] hover:bg-[#F8F6EF]"
              }`}
              title="Open Messages Page"
            >
              <MessageCircleMore className="h-5 w-5 text-[#E9785A]" />
              <span className="hidden sm:inline">Messages</span>
            </button>
          </div>
        </div>
      </header>

      {/* Main Page Body: Feed + Dedicated Sidebar */}
      <div className="mx-auto max-w-7xl px-4 sm:px-6 py-8 relative">
        <div className="grid grid-cols-1 gap-8 lg:grid-cols-[1fr_340px]">
          {/* =========================================
              LEFT COLUMN — MAIN COMMUNITY FEED
          ========================================== */}
          <main className="space-y-6">
            {/* Search Filter Banner */}
            {searchQuery && (
              <div className={`rounded-xl p-3 border border-[#6FA58D]/30 text-xs flex items-center justify-between ${isDarkMode ? "bg-[#15382E]" : "bg-white"}`}>
                <span>
                  Showing results for: <strong>"{searchQuery}"</strong> ({filteredPosts.length} posts, {filteredSuggestions.length} people)
                </span>
                <button onClick={() => setSearchQuery("")} className="text-[#E9785A] font-bold hover:underline">
                  Clear Search
                </button>
              </div>
            )}

            {/* Create Post Composer */}
            {currentUser && (
              <div className={`rounded-2xl ${themeCardClass} p-5`}>
                <form onSubmit={handleCreatePost}>
                  <div className="flex gap-4">
                    <img
                      src={currentUser.avatar || `https://api.dicebear.com/7.x/avataaars/svg?seed=${currentUser.id}`}
                      alt={currentUser.name}
                      className="h-11 w-11 rounded-full border-2 border-[#185C4A]/30 object-cover shrink-0"
                    />
                    <div className="flex-1">
                      <textarea
                        placeholder="Share a milestone, study tip, or request help from peers..."
                        value={content}
                        onChange={(e) => setContent(e.target.value)}
                        rows={3}
                        className={`w-full rounded-xl border p-3.5 text-sm focus:outline-none transition ${themeInputClass}`}
                      />

                      {showMediaInput && (
                        <div className={`mt-3 rounded-xl border p-3 space-y-3 ${isDarkMode ? "border-[#6FA58D]/30 bg-[#0B201A]" : "border-[#6FA58D]/30 bg-[#F8F6EF]"}`}>
                          <div className="flex items-center gap-3">
                            <select
                              value={mediaType}
                              onChange={(e) => setMediaType(e.target.value)}
                              className={`rounded-lg border px-3 py-1.5 text-xs font-medium focus:outline-none ${isDarkMode ? "border-[#6FA58D]/40 bg-[#15382E] text-[#E8F2EE]" : "border-[#6FA58D]/40 bg-white text-[#202724]"}`}
                            >
                              <option value="image">Image</option>
                              <option value="video">Video</option>
                            </select>

                            <label
                              className={`flex items-center gap-1.5 cursor-pointer rounded-lg px-3 py-1.5 text-xs font-semibold transition ${isDarkMode ? "bg-[#6FA58D]/20 text-[#6FA58D] hover:bg-[#6FA58D]/30" : "bg-[#6FA58D]/15 text-[#185C4A] hover:bg-[#6FA58D]/25"}`}
                            >
                              {processingMedia ? "Loading..." : "Upload from device"}
                              <input
                                type="file"
                                accept={mediaType === "video" ? "video/*" : "image/*"}
                                onChange={handleMediaFileChange}
                                disabled={processingMedia}
                                className="hidden"
                              />
                            </label>

                            {mediaFileName && (
                              <span className={`text-xs truncate max-w-[10rem] ${themeTextMuted}`} title={mediaFileName}>
                                {mediaFileName}
                              </span>
                            )}
                          </div>

                          <div className="flex items-center gap-2">
                            <span className={`text-[11px] uppercase tracking-wide font-semibold ${themeTextMuted}`}>or paste a link</span>
                            <input
                              type="url"
                              placeholder="Paste image or video direct link..."
                              value={mediaFileName ? "" : mediaUrl}
                              onChange={(e) => {
                                setMediaFileName("");
                                setMediaUrl(e.target.value);
                              }}
                              className={`flex-1 rounded-lg border px-3 py-1.5 text-xs focus:outline-none ${isDarkMode ? "border-[#6FA58D]/40 bg-[#15382E] text-[#E8F2EE]" : "border-[#6FA58D]/40 bg-white text-[#202724]"}`}
                            />
                          </div>

                          {mediaUrl && (
                            <div className="relative rounded-lg overflow-hidden border border-[#6FA58D]/20 max-h-56 flex items-center justify-center bg-black/5">
                              {mediaType === "video" ? (
                                <video src={mediaUrl} controls className="max-h-56 object-contain" />
                              ) : (
                                <img src={mediaUrl} alt="Preview" className="max-h-56 object-contain" />
                              )}
                              <button
                                type="button"
                                onClick={() => {
                                  setMediaUrl("");
                                  setMediaFileName("");
                                }}
                                className="absolute top-2 right-2 rounded-full bg-black/60 text-white p-1 hover:bg-black/80 transition"
                              >
                                <X className="h-3.5 w-3.5" />
                              </button>
                            </div>
                          )}
                        </div>
                      )}

                      <div className="mt-4 flex items-center justify-between border-t border-[#6FA58D]/20 pt-3">
                        <div className="flex gap-2">
                          <button
                            type="button"
                            onClick={() => {
                              setMediaType("image");
                              setShowMediaInput(!showMediaInput);
                            }}
                            className={`flex items-center gap-1.5 rounded-lg px-3 py-1.5 text-xs font-semibold transition ${isDarkMode ? "bg-[#6FA58D]/20 text-[#6FA58D]" : "bg-[#6FA58D]/15 text-[#185C4A]"}`}
                          >
                            <Image className="h-4 w-4" /> Photo
                          </button>
                          <button
                            type="button"
                            onClick={() => {
                              setMediaType("video");
                              setShowMediaInput(!showMediaInput);
                            }}
                            className="flex items-center gap-1.5 rounded-lg bg-[#E9785A]/15 px-3 py-1.5 text-xs font-semibold text-[#E9785A] hover:bg-[#E9785A]/25 transition"
                          >
                            <Video className="h-4 w-4 text-[#E9785A]" /> Video
                          </button>
                        </div>

                        <button
                          type="submit"
                          disabled={posting || processingMedia || (!content.trim() && !mediaUrl.trim())}
                          className="flex items-center gap-2 rounded-xl bg-[#185C4A] px-5 py-2 text-xs font-bold text-white shadow-sm hover:bg-[#124739] disabled:opacity-50 transition"
                        >
                          <Send className="h-3.5 w-3.5" /> {posting ? "Posting..." : "Post"}
                        </button>
                      </div>
                    </div>
                  </div>
                </form>
              </div>
            )}

            {/* Feed Navigation Filter Tabs */}
            <div className="flex items-center justify-between border-b border-[#6FA58D]/25 pb-3">
              <div className="flex gap-2">
                <button
                  onClick={() => setActiveTab("all")}
                  className={`rounded-full px-5 py-2 text-xs font-bold transition ${
                    activeTab === "all"
                      ? "bg-[#185C4A] text-white shadow-sm"
                      : `${themeTextMuted} hover:text-[#185C4A]`
                  }`}
                >
                  Community Feed
                </button>
                {currentUser && (
                  <>
                    <button
                      onClick={() => setActiveTab("saved")}
                      className={`rounded-full px-5 py-2 text-xs font-bold transition ${
                        activeTab === "saved"
                          ? "bg-[#185C4A] text-white shadow-sm"
                          : `${themeTextMuted} hover:text-[#185C4A]`
                      }`}
                    >
                      Saved Posts
                    </button>
                    <button
                      onClick={() => setActiveTab("my-posts")}
                      className={`rounded-full px-5 py-2 text-xs font-bold transition ${
                        activeTab === "my-posts"
                          ? "bg-[#185C4A] text-white shadow-sm"
                          : `${themeTextMuted} hover:text-[#185C4A]`
                      }`}
                    >
                      My Posts
                    </button>
                  </>
                )}
              </div>
              <span className={`text-xs font-semibold ${themeTextMuted}`}>
                {filteredPosts.length} {filteredPosts.length === 1 ? "Post" : "Posts"}
              </span>
            </div>

            {/* Posts Stream */}
            {loading ? (
              <div className="flex items-center justify-center py-16">
                <div className="h-8 w-8 animate-spin rounded-full border-4 border-[#185C4A] border-t-transparent"></div>
              </div>
            ) : filteredPosts.length === 0 ? (
              <div className={`rounded-2xl ${themeCardClass} p-12 text-center`}>
                <p className={`text-sm font-semibold ${themeTextPrimary}`}>No posts found.</p>
                <p className={`mt-1 text-xs ${themeTextMuted}`}>
                  {searchQuery
                    ? `No posts match "${searchQuery}". Try a different keyword.`
                    : activeTab === "saved"
                    ? "Save useful posts and they'll appear here."
                    : activeTab === "my-posts"
                    ? "You haven't created any posts yet. Use the composer above to create your first post!"
                    : "Be the first to share something with the community!"}
                </p>
              </div>
            ) : (
              <div className="space-y-6">
                {filteredPosts.map((post) => {
                  const isTeacher = post.author?.role === "teacher";
                  const isSelf = post.author?.id === currentUser?.id;
                  const friendStatus = friendStatuses[post.author?.id] || "none";
                  const hasRequested = requestedUserIds.has(post.author?.id);

                  return (
                    <article
                      key={post.id}
                      className={`rounded-2xl ${themeCardClass} p-6 shadow-sm transition hover:shadow-md`}
                    >
                      {/* Author Header */}
                      <div className="flex items-center justify-between mb-4">
                        <div className="flex items-center gap-3">
                          {isTeacher ? (
                            <Link to={`/teachers/${post.author.id}`} className="group flex items-center gap-3">
                              <img
                                src={post.author.avatar || `https://api.dicebear.com/7.x/avataaars/svg?seed=${post.author.id}`}
                                alt={post.author.name}
                                className="h-11 w-11 rounded-full border-2 border-[#185C4A]/30 object-cover"
                              />
                              <div>
                                <h3 className={`font-bold text-sm ${themeTextPrimary} group-hover:text-[#6FA58D] flex items-center gap-1.5 transition`}>
                                  {post.author.name}
                                  <span className="rounded-full bg-[#E8B84A]/20 px-2.5 py-0.5 text-[10px] font-bold text-[#E8B84A]">
                                    Instructor
                                  </span>
                                </h3>
                                <p className={`text-xs ${themeTextMuted}`}>{new Date(post.created_at).toLocaleDateString()}</p>
                              </div>
                            </Link>
                          ) : (
                            <div className="flex items-center gap-3">
                              <img
                                src={post.author?.avatar || `https://api.dicebear.com/7.x/avataaars/svg?seed=${post.author?.id || "user"}`}
                                alt={post.author?.name}
                                className="h-11 w-11 rounded-full border-2 border-[#6FA58D]/30 object-cover"
                              />
                              <div>
                                <h3 className={`font-bold text-sm ${themeTextPrimary}`}>{post.author?.name || "Student"}</h3>
                                <p className={`text-xs ${themeTextMuted}`}>{new Date(post.created_at).toLocaleDateString()}</p>
                              </div>
                            </div>
                          )}
                        </div>

                        {/* Post Author Manage Actions (Edit & Delete) or Friend Action */}
                        {isSelf ? (
                          <div className="flex items-center gap-2">
                            <button
                              onClick={() => handleOpenEdit(post)}
                              className={`flex items-center gap-1.5 rounded-lg px-3 py-1.5 text-xs font-bold transition border ${
                                isDarkMode
                                  ? "border-[#6FA58D]/40 bg-[#15382E] text-[#6FA58D] hover:bg-[#1C483B]"
                                  : "border-[#6FA58D]/30 bg-[#F8F6EF] text-[#185C4A] hover:bg-[#6FA58D]/20"
                              }`}
                              title="Edit Post"
                            >
                              <Pencil className="h-3.5 w-3.5" /> Edit
                            </button>
                            <button
                              onClick={() => setDeletingPostId(post.id)}
                              className="flex items-center gap-1.5 rounded-lg px-3 py-1.5 text-xs font-bold bg-[#E9785A]/15 text-[#E9785A] hover:bg-[#E9785A]/25 transition"
                              title="Delete Post"
                            >
                              <Trash2 className="h-3.5 w-3.5" /> Delete
                            </button>
                          </div>
                        ) : (
                          !isTeacher && currentUser?.role === "student" && (
                            <div>
                              {friendStatus === "none" && !hasRequested && (
                                <button
                                  onClick={() => handleSendFriendRequest(post.author.id)}
                                  className="flex items-center gap-1.5 rounded-lg bg-[#6FA58D]/20 px-3 py-1.5 text-xs font-bold text-[#6FA58D] hover:bg-[#6FA58D]/30 transition"
                                >
                                  <UserPlus className="h-3.5 w-3.5" /> Add Friend
                                </button>
                              )}
                              {(friendStatus === "pending_sent" || hasRequested) && (
                                <span className={`rounded-lg bg-[#E8B84A]/20 px-3 py-1.5 text-xs ${themeTextPrimary} font-semibold`}>
                                  Request Sent
                                </span>
                              )}
                              {friendStatus === "accepted" && (
                                <span className="flex items-center gap-1 text-xs text-[#6FA58D] font-semibold">
                                  <UserCheck className="h-3.5 w-3.5" /> Friends
                                </span>
                              )}
                            </div>
                          )
                        )}
                      </div>

                      {/* Content Body */}
                      {post.content && (
                        <p className={`mb-4 text-sm leading-relaxed ${themeTextPrimary} whitespace-pre-wrap`}>
                          {post.content}
                        </p>
                      )}

                      {/* Media Attachment */}
                      {post.media_url && (
                        <div className={`mb-4 overflow-hidden rounded-xl border border-[#6FA58D]/20 ${isDarkMode ? "bg-[#0B201A]" : "bg-[#F8F6EF]"}`}>
                          {post.media_type === "video" ? (
                            <video src={post.media_url} controls className="max-h-96 w-full object-contain" />
                          ) : (
                            <img src={post.media_url} alt="Attachment" className="max-h-96 w-full object-contain" />
                          )}
                        </div>
                      )}

                      {/* Social Actions Footer */}
                      <div className={`flex items-center justify-between border-t border-[#6FA58D]/20 pt-3 text-xs ${themeTextMuted}`}>
                        <div className="flex items-center gap-6">
                          <Link
                            to={`/community/post/${post.id}`}
                            className="flex items-center gap-1.5 font-medium hover:text-[#6FA58D] transition"
                          >
                            <MessageSquare className="h-4 w-4 text-[#6FA58D]" /> {post.commentsCount || 0} Comments
                          </Link>

                          <button
                            onClick={() => handleToggleSave(post.id)}
                            className={`flex items-center gap-1.5 font-medium transition ${
                              post.isSaved ? "text-[#E9785A] font-bold" : "hover:text-[#6FA58D]"
                            }`}
                          >
                            <Bookmark className="h-4 w-4" fill={post.isSaved ? "#E9785A" : "none"} />
                            {post.isSaved ? "Saved" : "Save"}
                          </button>
                        </div>

                        <button
                          onClick={() => handleOpenShare(post)}
                          className="flex items-center gap-1.5 font-medium hover:text-[#6FA58D] transition"
                        >
                          <Share2 className="h-4 w-4 text-[#E9785A]" /> Share
                        </button>
                      </div>
                    </article>
                  );
                })}
              </div>
            )}
          </main>

          {/* =========================================
              RIGHT COLUMN — DEDICATED COMMUNITY SIDEBAR (Desktop)
          ========================================== */}
          <aside className="hidden lg:block space-y-6">
            <SidebarContent
              isDarkMode={isDarkMode}
              friendRequests={friendRequests}
              friendSuggestions={filteredSuggestions}
              topChats={topChats}
              requestedUserIds={requestedUserIds}
              activeTab={activeTab}
              setActiveTab={setActiveTab}
              onRespondFriendRequest={handleRespondFriendRequest}
              onSendFriendRequest={handleSendFriendRequest}
              onOpenChat={(convId) => navigate(`/messages?conv=${convId}`)}
            />
          </aside>
        </div>
      </div>

      {/* Messages Floating Launcher Icon (Lifted above Focus Widget) */}
      <button
        onClick={() => navigate("/messages")}
        className="fixed bottom-28 right-6 z-40 flex h-14 w-14 items-center justify-center rounded-full bg-[#185C4A] text-white shadow-2xl hover:bg-[#124739] transition-transform hover:scale-105"
        title="Open Messages"
      >
        <MessageCircleMore className="h-6 w-6 text-[#E8B84A]" />
        {friendRequests.length > 0 && (
          <span className="absolute -top-1 -right-1 flex h-5 w-5 items-center justify-center rounded-full bg-[#E9785A] text-[10px] font-bold text-white shadow">
            {friendRequests.length}
          </span>
        )}
      </button>

      {/* Messages & Friends Side Drawer */}
      {sidebarOpen && (
        <div className="fixed inset-0 z-50 flex justify-end bg-black/60 backdrop-blur-sm">
          <div className={`w-full max-w-sm h-full p-5 overflow-y-auto shadow-2xl border-l border-[#6FA58D]/30 flex flex-col ${isDarkMode ? "bg-[#0B201A] text-[#E8F2EE]" : "bg-[#F8F6EF] text-[#202724]"}`}>
            <div className="flex items-center justify-between border-b border-[#6FA58D]/25 pb-4 mb-4">
              <h3 className="font-extrabold text-base flex items-center gap-2">
                <MessageCircleMore className="h-5 w-5 text-[#E9785A]" /> Community Messages
              </h3>
              <button
                onClick={() => setSidebarOpen(false)}
                className="rounded-lg p-1.5 text-[#68736E] hover:bg-[#6FA58D]/20 transition"
              >
                <X className="h-5 w-5" />
              </button>
            </div>
            <SidebarContent
              isDarkMode={isDarkMode}
              friendRequests={friendRequests}
              friendSuggestions={filteredSuggestions}
              topChats={topChats}
              requestedUserIds={requestedUserIds}
              activeTab={activeTab}
              setActiveTab={(tab) => {
                setActiveTab(tab);
                setSidebarOpen(false);
              }}
              onRespondFriendRequest={handleRespondFriendRequest}
              onSendFriendRequest={handleSendFriendRequest}
              onOpenChat={(convId) => {
                setSidebarOpen(false);
                navigate(`/messages?conv=${convId}`);
              }}
            />
          </div>
        </div>
      )}

      {/* Share Modal */}
      {sharePost && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4">
          <div className={`w-full max-w-md rounded-2xl border border-[#6FA58D]/30 p-6 shadow-2xl ${isDarkMode ? "bg-[#15382E] text-[#E8F2EE]" : "bg-white text-[#202724]"}`}>
            <h3 className="text-lg font-bold mb-4">Share Post</h3>

            <div className="space-y-4">
              <button
                onClick={handleCopyLink}
                className={`flex w-full items-center justify-between rounded-xl border p-3 text-sm font-semibold hover:border-[#185C4A] ${isDarkMode ? "border-[#6FA58D]/30 bg-[#0B201A]" : "border-[#6FA58D]/30 bg-[#F8F6EF]"}`}
              >
                <span className="flex items-center gap-2">
                  <Share2 className="h-4 w-4 text-[#E9785A]" /> Copy Post Link
                </span>
                {copiedLink ? <Check className="h-4 w-4 text-[#185C4A]" /> : <Copy className="h-4 w-4 text-[#68736E]" />}
              </button>

              <div className="border-t border-[#6FA58D]/20 pt-4">
                <label className="block text-xs font-bold uppercase tracking-wider mb-2 text-[#9EC5B4]">
                  Share in Chat Conversation
                </label>
                <select
                  value={selectedConv}
                  onChange={(e) => setSelectedConv(e.target.value)}
                  className={`w-full rounded-xl border px-3 py-2.5 text-sm focus:border-[#185C4A] focus:outline-none ${isDarkMode ? "border-[#6FA58D]/30 bg-[#0B201A] text-[#E8F2EE]" : "border-[#6FA58D]/30 bg-[#F8F6EF] text-[#202724]"}`}
                >
                  <option value="">Select a chat conversation...</option>
                  {conversations.map((c) => (
                    <option key={c.id} value={c.id}>
                      {c.type === "group" ? `👥 ${c.title}` : `💬 ${c.title}`}
                    </option>
                  ))}
                </select>

                <button
                  onClick={handleShareInChat}
                  disabled={!selectedConv || sharing}
                  className="mt-3 w-full rounded-xl bg-[#185C4A] py-2.5 text-sm font-bold text-white hover:bg-[#124739] disabled:opacity-50 transition"
                >
                  {sharing ? "Sharing..." : "Send in Chat"}
                </button>
              </div>
            </div>

            <button
              onClick={() => setSharePost(null)}
              className="mt-5 w-full text-center text-xs font-semibold text-[#9EC5B4] hover:text-[#E8F2EE]"
            >
              Cancel
            </button>
          </div>
        </div>
      )}

      {/* Edit Post Modal */}
      {editingPost && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4">
          <div className={`w-full max-w-lg rounded-2xl p-6 shadow-2xl border border-[#6FA58D]/30 ${isDarkMode ? "bg-[#0B201A] text-[#E8F2EE]" : "bg-[#F8F6EF] text-[#202724]"}`}>
            <div className="flex items-center justify-between border-b border-[#6FA58D]/25 pb-3 mb-4">
              <h3 className="font-extrabold text-base flex items-center gap-2 text-[#185C4A] dark:text-[#6FA58D]">
                <Pencil className="h-5 w-5 text-[#E9785A]" /> Edit Post
              </h3>
              <button onClick={() => setEditingPost(null)} className="text-[#68736E] hover:text-[#202724]">
                <X className="h-5 w-5" />
              </button>
            </div>

            <form onSubmit={handleSaveEdit} className="space-y-4">
              <div>
                <label className="block text-xs font-bold mb-1.5">Post Content</label>
                <textarea
                  rows={4}
                  value={editContent}
                  onChange={(e) => setEditContent(e.target.value)}
                  className={`w-full rounded-xl border p-3 text-sm focus:border-[#185C4A] focus:outline-none transition ${themeInputClass}`}
                  placeholder="Update post text content..."
                />
              </div>

              <div>
                <label className="block text-xs font-bold mb-1.5">Photo / Video</label>
                <div className="flex items-center gap-2">
                  <label
                    className={`flex items-center gap-1.5 cursor-pointer rounded-xl px-3 py-2 text-xs font-semibold transition shrink-0 ${isDarkMode ? "bg-[#6FA58D]/20 text-[#6FA58D] hover:bg-[#6FA58D]/30" : "bg-[#6FA58D]/15 text-[#185C4A] hover:bg-[#6FA58D]/25"}`}
                  >
                    {editProcessingMedia ? "Loading..." : "Upload from device"}
                    <input
                      type="file"
                      accept="image/*,video/*"
                      onChange={handleEditMediaFileChange}
                      disabled={editProcessingMedia}
                      className="hidden"
                    />
                  </label>
                  {editMediaFileName && (
                    <span className={`text-xs truncate ${themeTextMuted}`} title={editMediaFileName}>
                      {editMediaFileName}
                    </span>
                  )}
                </div>
                <div className="flex gap-2 mt-2">
                  <input
                    type="url"
                    value={editMediaFileName ? "" : editMediaUrl}
                    onChange={(e) => {
                      setEditMediaFileName("");
                      setEditMediaUrl(e.target.value);
                    }}
                    placeholder="...or paste an image/video link"
                    className={`flex-1 rounded-xl border p-2.5 text-xs focus:border-[#185C4A] focus:outline-none transition ${themeInputClass}`}
                  />
                  {editMediaUrl && (
                    <button
                      type="button"
                      onClick={() => {
                        setEditMediaUrl("");
                        setEditMediaType("");
                        setEditMediaFileName("");
                      }}
                      className="rounded-xl bg-[#E9785A]/15 text-[#E9785A] px-3 py-2 text-xs font-bold hover:bg-[#E9785A]/25 transition"
                    >
                      Remove
                    </button>
                  )}
                </div>
              </div>

              {editMediaUrl && (
                <div className="rounded-xl overflow-hidden border border-[#6FA58D]/30 max-h-48 flex items-center justify-center bg-black/5">
                  {editMediaType === "video" ? (
                    <video src={editMediaUrl} controls className="max-h-48 object-contain" />
                  ) : (
                    <img src={editMediaUrl} alt="Preview" className="max-h-48 object-contain" />
                  )}
                </div>
              )}

              <div className="flex items-center justify-end gap-3 pt-2 border-t border-[#6FA58D]/25">
                <button
                  type="button"
                  onClick={() => setEditingPost(null)}
                  className={`rounded-xl px-4 py-2 text-xs font-bold transition ${themeTextMuted} hover:text-[#202724]`}
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={isSubmittingEdit || editProcessingMedia}
                  className="flex items-center gap-2 rounded-xl bg-[#185C4A] text-white px-5 py-2 text-xs font-bold shadow-md hover:bg-[#124739] transition disabled:opacity-50"
                >
                  {isSubmittingEdit ? "Saving..." : "Save Changes"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Delete Confirmation Modal */}
      {deletingPostId && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4">
          <div className={`w-full max-w-sm rounded-2xl p-6 shadow-2xl border border-[#6FA58D]/30 ${isDarkMode ? "bg-[#0B201A] text-[#E8F2EE]" : "bg-[#F8F6EF] text-[#202724]"}`}>
            <div className="text-center">
              <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-full bg-[#E9785A]/20 text-[#E9785A] mb-4">
                <Trash2 className="h-6 w-6" />
              </div>
              <h3 className="text-base font-extrabold mb-1">Delete Post?</h3>
              <p className={`text-xs mb-6 ${themeTextMuted}`}>
                Are you sure you want to delete this post? This action cannot be undone and will remove all comments and saves.
              </p>
              <div className="flex gap-3">
                <button
                  onClick={() => setDeletingPostId(null)}
                  className={`flex-1 rounded-xl border border-[#6FA58D]/30 py-2.5 text-xs font-bold transition ${isDarkMode ? "hover:bg-[#15382E]" : "hover:bg-white"}`}
                >
                  Cancel
                </button>
                <button
                  onClick={() => handleDeletePost(deletingPostId)}
                  disabled={isSubmittingDelete}
                  className="flex-1 rounded-xl bg-[#E9785A] text-white py-2.5 text-xs font-bold shadow-md hover:bg-[#d86749] transition disabled:opacity-50"
                >
                  {isSubmittingDelete ? "Deleting..." : "Yes, Delete"}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

/* =====================================================
   DEDICATED COMMUNITY SIDEBAR COMPONENT
===================================================== */
function SidebarContent({
  isDarkMode,
  friendRequests,
  friendSuggestions,
  topChats,
  requestedUserIds,
  activeTab,
  setActiveTab,
  onRespondFriendRequest,
  onSendFriendRequest,
  onOpenChat,
}) {
  const cardBg = isDarkMode
    ? "border-[#6FA58D]/30 bg-[#15382E]/90 backdrop-blur-md text-[#E8F2EE]"
    : "border-[#6FA58D]/25 bg-white/90 backdrop-blur-md text-[#202724]";

  const itemBg = isDarkMode ? "bg-[#0B201A]/70 border-[#6FA58D]/20" : "bg-[#F8F6EF]/70 border-[#6FA58D]/15";
  const textMuted = isDarkMode ? "text-[#9EC5B4]" : "text-[#68736E]";

  return (
    <div className="space-y-6">
      {/* -------------------------------------------------
          FRIENDS SECTION
      -------------------------------------------------- */}
      <div className={`rounded-2xl border p-4 shadow-sm ${cardBg}`}>
        <div className="flex items-center justify-between mb-3 border-b border-[#6FA58D]/20 pb-2">
          <h4 className="text-xs font-extrabold uppercase tracking-wider text-[#6FA58D] flex items-center gap-1.5">
            <Users className="h-4 w-4 text-[#E9785A]" /> Friends
          </h4>
          {friendRequests.length > 0 && (
            <span className="rounded-full bg-[#E9785A] px-2 py-0.5 text-[10px] font-extrabold text-white">
              {friendRequests.length}
            </span>
          )}
        </div>

        {/* Friend Requests List */}
        {friendRequests.length > 0 && (
          <div className="mb-4 space-y-2">
            <span className="text-[11px] font-bold text-[#E9785A] block uppercase">Pending Requests</span>
            {friendRequests.map((req) => (
              <div key={req.id} className={`rounded-xl border p-2.5 ${itemBg}`}>
                <div className="flex items-center gap-2.5 mb-2">
                  <img
                    src={req.sender?.avatar || `https://api.dicebear.com/7.x/avataaars/svg?seed=${req.sender_id}`}
                    alt={req.sender?.name}
                    className="h-8 w-8 rounded-full object-cover border border-[#6FA58D]/30"
                  />
                  <span className="text-xs font-bold truncate">{req.sender?.name}</span>
                </div>
                <div className="flex gap-2">
                  <button
                    onClick={() => onRespondFriendRequest(req.id, "accepted")}
                    className="flex-1 rounded-lg bg-[#185C4A] py-1 text-[11px] font-bold text-white hover:bg-[#124739]"
                  >
                    Accept
                  </button>
                  <button
                    onClick={() => onRespondFriendRequest(req.id, "rejected")}
                    className="flex-1 rounded-lg bg-[#D95C5C]/20 py-1 text-[11px] font-bold text-[#D95C5C] hover:bg-[#D95C5C]/30"
                  >
                    Reject
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}

        {/* Friend Suggestions List */}
        <div className="space-y-2">
          <span className={`text-[11px] font-bold block uppercase ${textMuted}`}>Suggested Students</span>
          {friendSuggestions.length === 0 ? (
            <p className={`text-xs py-2 text-center ${textMuted}`}>No suggestions right now.</p>
          ) : (
            friendSuggestions.slice(0, 5).map((sugg) => {
              const hasRequested = requestedUserIds.has(sugg.id);

              return (
                <div key={sugg.id} className={`flex items-center justify-between rounded-xl p-2 border ${itemBg}`}>
                  <div className="flex items-center gap-2 min-w-0">
                    <img
                      src={sugg.avatar || `https://api.dicebear.com/7.x/avataaars/svg?seed=${sugg.id}`}
                      alt={sugg.name}
                      className="h-7 w-7 rounded-full object-cover shrink-0"
                    />
                    <div className="min-w-0">
                      <p className="text-xs font-bold truncate">{sugg.name}</p>
                      {sugg.student_class && (
                        <p className={`text-[10px] truncate ${textMuted}`}>{sugg.student_class}</p>
                      )}
                    </div>
                  </div>

                  <button
                    onClick={() => onSendFriendRequest(sugg.id)}
                    disabled={hasRequested}
                    className={`rounded-lg px-2.5 py-1 text-[11px] font-bold transition shrink-0 ${
                      hasRequested
                        ? "bg-[#E8B84A]/20 text-[#E8B84A]"
                        : "bg-[#185C4A] text-white hover:bg-[#124739]"
                    }`}
                  >
                    {hasRequested ? "Sent" : "+ Add"}
                  </button>
                </div>
              );
            })
          )}
        </div>
      </div>

      {/* -------------------------------------------------
          MESSAGES SECTION
      -------------------------------------------------- */}
      <div className={`rounded-2xl border p-4 shadow-sm ${cardBg}`}>
        <div className="flex items-center justify-between mb-3 border-b border-[#6FA58D]/20 pb-2">
          <h4 className="text-xs font-extrabold uppercase tracking-wider text-[#6FA58D] flex items-center gap-1.5">
            <MessageCircle className="h-4 w-4 text-[#E9785A]" /> Top Chats
          </h4>
        </div>

        <div className="space-y-1.5">
          {topChats.length === 0 ? (
            <p className={`text-xs py-4 text-center ${textMuted}`}>No active chats.</p>
          ) : (
            topChats.slice(0, 5).map((conv) => (
              <button
                key={conv.id}
                onClick={() => onOpenChat(conv.id)}
                className={`flex w-full items-center gap-2.5 rounded-xl p-2 text-left transition group ${isDarkMode ? "hover:bg-[#0B201A]" : "hover:bg-[#F8F6EF]"}`}
              >
                {conv.type === "group" ? (
                  <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-[#185C4A]/20 font-bold text-xs text-[#6FA58D]">
                    {conv.group?.icon || "👥"}
                  </div>
                ) : (
                  <img
                    src={conv.targetUser?.avatar || `https://api.dicebear.com/7.x/avataaars/svg?seed=${conv.targetUser?.id || "user"}`}
                    alt={conv.title}
                    className="h-8 w-8 rounded-full object-cover border border-[#6FA58D]/30 shrink-0"
                  />
                )}
                <div className="min-w-0 flex-1">
                  <p className="text-xs font-bold truncate group-hover:text-[#6FA58D] transition">
                    {conv.title}
                  </p>
                  <p className={`text-[11px] truncate ${textMuted}`}>
                    {conv.lastMessage?.content || "No messages yet"}
                  </p>
                </div>
                <ChevronRight className={`h-3.5 w-3.5 shrink-0 ${textMuted}`} />
              </button>
            ))
          )}
        </div>
      </div>

      {/* -------------------------------------------------
          COMMUNITY SECTION
      -------------------------------------------------- */}
      <div className={`rounded-2xl border p-4 shadow-sm ${cardBg}`}>
        <h4 className="text-xs font-extrabold uppercase tracking-wider text-[#6FA58D] mb-3 border-b border-[#6FA58D]/20 pb-2">
          Community
        </h4>
        <button
          onClick={() => setActiveTab(activeTab === "saved" ? "all" : "saved")}
          className={`flex w-full items-center justify-between rounded-xl px-3 py-2.5 text-xs font-bold transition ${
            activeTab === "saved"
              ? "bg-[#E9785A] text-white"
              : `${itemBg} hover:bg-[#6FA58D]/20`
          }`}
        >
          <span className="flex items-center gap-2">
            <Bookmark className="h-4 w-4" /> Saved Posts
          </span>
          <ChevronRight className="h-3.5 w-3.5" />
        </button>
      </div>
    </div>
  );
}