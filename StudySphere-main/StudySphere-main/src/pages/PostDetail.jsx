import React, { useState, useEffect } from "react";
import { useParams, useNavigate, Link } from "react-router-dom";
import { communityApi, messagingApi } from "../lib/api";
import { MessageSquare, Bookmark, Share2, ArrowLeft, Send, Copy, Check, Sun, Moon } from "lucide-react";

export default function PostDetail() {
  const { postId } = useParams();
  const navigate = useNavigate();

  const [post, setPost] = useState(null);
  const [comments, setComments] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [newComment, setNewComment] = useState("");
  const [submittingComment, setSubmittingComment] = useState(false);

  // Dark mode state
  const [isDarkMode, setIsDarkMode] = useState(() => {
    return localStorage.getItem("community_dark_mode") === "true";
  });

  // Share modal state
  const [showShareModal, setShowShareModal] = useState(false);
  const [conversations, setConversations] = useState([]);
  const [selectedConv, setSelectedConv] = useState("");
  const [copiedLink, setCopiedLink] = useState(false);
  const [sharing, setSharing] = useState(false);

  useEffect(() => {
    localStorage.setItem("community_dark_mode", isDarkMode);
  }, [isDarkMode]);

  useEffect(() => {
    loadPost();
  }, [postId]);

  async function loadPost() {
    setLoading(true);
    setError("");
    try {
      const data = await communityApi.getPost(postId);
      setPost(data);
      const comms = await communityApi.getComments(postId);
      setComments(comms);
    } catch (err) {
      setError(err.message || "Failed to load post.");
    } finally {
      setLoading(false);
    }
  }

  async function handleAddComment(e) {
    e.preventDefault();
    if (!newComment.trim()) return;
    setSubmittingComment(true);
    try {
      const added = await communityApi.addComment(postId, { content: newComment });
      setComments((prev) => [...prev, added]);
      setNewComment("");
      setPost((prev) => (prev ? { ...prev, commentsCount: (prev.commentsCount || 0) + 1 } : prev));
    } catch (err) {
      alert(err.message || "Failed to add comment.");
    } finally {
      setSubmittingComment(false);
    }
  }

  async function handleToggleSave() {
    if (!post) return;
    try {
      const res = await communityApi.toggleSave(post.id);
      setPost((prev) => ({ ...prev, isSaved: res.isSaved }));
    } catch (err) {
      alert(err.message || "Failed to save post.");
    }
  }

  async function handleOpenShare() {
    setShowShareModal(true);
    try {
      const convs = await messagingApi.getConversations();
      setConversations(convs);
    } catch (err) {
      console.error(err);
    }
  }

  function handleCopyLink() {
    const link = `${window.location.origin}/community/post/${post.id}`;
    navigator.clipboard.writeText(link);
    setCopiedLink(true);
    setTimeout(() => setCopiedLink(false), 2000);
  }

  async function handleShareInChat() {
    if (!selectedConv || !post) return;
    setSharing(true);
    try {
      await messagingApi.sendMessage(selectedConv, {
        type: "POST_SHARE",
        content: `Shared a community post: "${post.content ? post.content.slice(0, 50) + "..." : "Media post"}"`,
        metadata: {
          postId: post.id,
          postAuthor: post.author?.name || "Author",
          snippet: post.content || "Media post",
        },
      });
      alert("Post shared in chat!");
      setShowShareModal(false);
    } catch (err) {
      alert(err.message || "Failed to share in chat.");
    } finally {
      setSharing(false);
    }
  }

  const themeContainerClass = isDarkMode
    ? "bg-[#0B201A] text-[#E8F2EE]"
    : "bg-[#F8F6EF] text-[#202724]";

  const themeCardClass = isDarkMode
    ? "border border-[#6FA58D]/30 bg-[#15382E]/90 backdrop-blur-md shadow-md"
    : "border border-[#6FA58D]/25 bg-white/90 backdrop-blur-md shadow-sm";

  const themeTextPrimary = isDarkMode ? "text-[#E8F2EE]" : "text-[#202724]";
  const themeTextMuted = isDarkMode ? "text-[#9EC5B4]" : "text-[#68736E]";
  const themeInputClass = isDarkMode
    ? "border-[#6FA58D]/40 bg-[#0B201A]/80 text-[#E8F2EE] placeholder-[#9EC5B4]"
    : "border-[#6FA58D]/30 bg-[#F8F6EF] text-[#202724] placeholder-[#68736E]";

  if (loading) {
    return (
      <div className={`flex min-h-screen items-center justify-center ${themeContainerClass}`}>
        <div className="h-8 w-8 animate-spin rounded-full border-4 border-[#185C4A] border-t-transparent"></div>
      </div>
    );
  }

  if (error || !post) {
    return (
      <div className={`min-h-screen p-8 text-center ${themeContainerClass}`}>
        <p className="text-[#D95C5C] mb-4">{error || "Post not found."}</p>
        <button
          onClick={() => navigate("/community")}
          className="inline-flex items-center gap-2 rounded-xl bg-[#185C4A] px-5 py-2.5 text-sm font-bold text-white shadow-sm hover:bg-[#124739]"
        >
          <ArrowLeft className="h-4 w-4" /> Back to Community
        </button>
      </div>
    );
  }

  return (
    <div className={`min-h-screen font-sans antialiased transition-colors duration-300 ${themeContainerClass}`}>
      <div className="mx-auto max-w-3xl px-6 py-10">
        <div className="flex items-center justify-between mb-6">
          <button
            onClick={() => navigate("/community")}
            className={`flex items-center gap-2 text-sm font-semibold ${themeTextMuted} hover:text-[#185C4A] transition`}
          >
            <ArrowLeft className="h-4 w-4" /> Back to Community
          </button>

          <button
            onClick={() => setIsDarkMode(!isDarkMode)}
            className={`flex items-center gap-2 rounded-xl border p-2 text-xs font-bold transition ${
              isDarkMode
                ? "border-[#6FA58D]/40 bg-[#15382E] text-[#E8F2EE]"
                : "border-[#6FA58D]/30 bg-white text-[#202724]"
            }`}
          >
            {isDarkMode ? <Sun className="h-3.5 w-3.5 text-[#E8B84A]" /> : <Moon className="h-3.5 w-3.5 text-[#185C4A]" />}
          </button>
        </div>

        {/* Main Post Glass Card */}
        <div className={`rounded-2xl ${themeCardClass} p-6`}>
          {/* Author Header */}
          <div className="flex items-center gap-4 mb-4">
            {post.author?.role === "teacher" ? (
              <Link to={`/teachers/${post.author.id}`} className="group flex items-center gap-4">
                <img
                  src={post.author.avatar || `https://api.dicebear.com/7.x/avataaars/svg?seed=${post.author.id}`}
                  alt={post.author.name}
                  className="h-12 w-12 rounded-full border-2 border-[#185C4A]/30 object-cover"
                />
                <div>
                  <h3 className={`font-bold ${themeTextPrimary} group-hover:text-[#6FA58D] flex items-center gap-2 transition`}>
                    {post.author.name}
                    <span className="rounded-full bg-[#E8B84A]/20 px-2.5 py-0.5 text-xs font-bold text-[#E8B84A]">
                      Instructor
                    </span>
                  </h3>
                  <p className={`text-xs ${themeTextMuted}`}>{new Date(post.created_at).toLocaleString()}</p>
                </div>
              </Link>
            ) : (
              <div className="flex items-center gap-4">
                <img
                  src={post.author?.avatar || `https://api.dicebear.com/7.x/avataaars/svg?seed=${post.author?.id || "user"}`}
                  alt={post.author?.name}
                  className="h-12 w-12 rounded-full border-2 border-[#6FA58D]/30 object-cover"
                />
                <div>
                  <h3 className={`font-bold ${themeTextPrimary}`}>{post.author?.name || "Student"}</h3>
                  <p className={`text-xs ${themeTextMuted}`}>{new Date(post.created_at).toLocaleString()}</p>
                </div>
              </div>
            )}
          </div>

          {/* Post Content */}
          {post.content && (
            <p className={`mb-4 text-base leading-relaxed ${themeTextPrimary} whitespace-pre-wrap`}>{post.content}</p>
          )}

          {/* Post Media */}
          {post.media_url && (
            <div className={`mb-6 overflow-hidden rounded-xl border border-[#6FA58D]/20 ${isDarkMode ? "bg-[#0B201A]" : "bg-[#F8F6EF]"}`}>
              {post.media_type === "video" ? (
                <video src={post.media_url} controls className="max-h-[500px] w-full object-contain" />
              ) : (
                <img src={post.media_url} alt="Post attachment" className="max-h-[500px] w-full object-contain" />
              )}
            </div>
          )}

          {/* Action Row */}
          <div className={`flex items-center justify-between border-t border-[#6FA58D]/20 pt-4 ${themeTextMuted} text-xs`}>
            <div className="flex items-center gap-6">
              <span className="flex items-center gap-2 font-medium">
                <MessageSquare className="h-5 w-5 text-[#6FA58D]" />
                {comments.length} Comments
              </span>
              <button
                onClick={handleToggleSave}
                className={`flex items-center gap-2 font-medium transition ${
                  post.isSaved ? "text-[#E9785A] font-bold" : "hover:text-[#6FA58D]"
                }`}
              >
                <Bookmark className="h-5 w-5" fill={post.isSaved ? "#E9785A" : "none"} />
                {post.isSaved ? "Saved" : "Save"}
              </button>
            </div>

            <button onClick={handleOpenShare} className="flex items-center gap-2 font-medium hover:text-[#6FA58D] transition">
              <Share2 className="h-5 w-5 text-[#E9785A]" /> Share
            </button>
          </div>
        </div>

        {/* Comments Section Glass Card */}
        <div className={`mt-8 rounded-2xl ${themeCardClass} p-6`}>
          <h3 className={`mb-6 text-lg font-bold ${themeTextPrimary}`}>Comments ({comments.length})</h3>

          {/* Add Comment Form */}
          <form onSubmit={handleAddComment} className="mb-6 flex gap-3">
            <input
              type="text"
              placeholder="Write a comment..."
              value={newComment}
              onChange={(e) => setNewComment(e.target.value)}
              className={`flex-1 rounded-xl border px-4 py-2.5 text-sm focus:border-[#185C4A] focus:outline-none transition ${themeInputClass}`}
            />
            <button
              type="submit"
              disabled={submittingComment || !newComment.trim()}
              className="flex items-center gap-2 rounded-xl bg-[#185C4A] px-5 py-2.5 text-xs font-bold text-white hover:bg-[#124739] disabled:opacity-50 transition"
            >
              <Send className="h-4 w-4" /> Comment
            </button>
          </form>

          {/* Comment Stream */}
          <div className="space-y-3">
            {comments.length === 0 ? (
              <p className={`text-center text-xs ${themeTextMuted} py-4`}>No comments yet. Be the first to join the conversation!</p>
            ) : (
              comments.map((c) => (
                <div key={c.id} className={`flex items-start gap-3 rounded-xl p-3.5 border ${isDarkMode ? "bg-[#0B201A]/80 border-[#6FA58D]/20" : "bg-[#F8F6EF]/70 border-[#6FA58D]/20"}`}>
                  <img
                    src={c.user?.avatar || `https://api.dicebear.com/7.x/avataaars/svg?seed=${c.user_id}`}
                    alt={c.user?.name}
                    className="h-8 w-8 rounded-full object-cover border border-[#6FA58D]/30 shrink-0"
                  />
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center justify-between">
                      <h4 className={`text-xs font-bold ${themeTextPrimary}`}>{c.user?.name || "Student"}</h4>
                      <span className={`text-[10px] ${themeTextMuted}`}>{new Date(c.created_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</span>
                    </div>
                    <p className={`mt-1 text-xs ${themeTextPrimary} leading-relaxed`}>{c.content}</p>
                  </div>
                </div>
              ))
            )}
          </div>
        </div>
      </div>

      {/* Share Modal */}
      {showShareModal && (
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
              onClick={() => setShowShareModal(false)}
              className="mt-5 w-full text-center text-xs font-semibold text-[#9EC5B4] hover:text-[#E8F2EE]"
            >
              Cancel
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
