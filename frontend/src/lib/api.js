import axios from 'axios'

const api = axios.create({ baseURL: import.meta.env.VITE_API_URL || '/api' })

export const getMe = (creator_id) => api.get(`/auth/me?creator_id=${creator_id}`)
export const getDashboard = (creator_id) => api.get(`/dashboard?creator_id=${creator_id}`)
export const getAllVideos = (creator_id) => api.get(`/dashboard/videos/all?creator_id=${creator_id}`)
export const getComments = (creator_id, video_id, max = 50) => api.get(`/cognitive/comments/video?creator_id=${creator_id}&video_id=${video_id}&max_comments=${max}`)
export const analyzeComments = (data) => api.post('/cognitive/comments/analyze', data)
export const postReply = (data) => api.post('/cognitive/comments/reply', data)
export const generateHooks = (data) => api.post('/cognitive/hooks/generate', data)
export const repurposeContent = (data) => api.post('/cognitive/repurpose', data)
export const translateScript = (data) => api.post('/voice/translate', data)
export const getTrends = (data) => api.post('/growth/trends', data)
export const getHashtagROI = (data) => api.post('/growth/hashtags', data)
export const findCollaborators = (data) => api.post('/growth/collaborators', data)
export const getRetention = (data) => api.post('/analytics/retention', data)
export const getRevenue = (data) => api.post('/analytics/revenue', data)
export const fakeScan = (data) => api.post('/analytics/fake-scan', data)
export const getStudioAnalytics = (data) => api.post('/analytics/studio', data)
export const chatWithStudio = (data) => api.post('/analytics/studio/chat', data)
export const getChannelAnalyticsOverview = (data) => api.post('/analytics/channel-overview', data)
export const getAudienceInsights = (data) => api.post('/analytics/audience-insights', data)
export const analyzeAudienceMood = (data) => api.post('/cognitive/comments/audience-analysis', data)
export const getInspirationIdeas = () => api.get('/analytics/inspiration-ideas')
export const getVideoDetail = (data) => api.post('/analytics/video-detail', data)
export const analyzeMetadata = (data) => api.post('/cognitive/metadata/analyze', data)
export const improveHook = (data) => api.post('/cognitive/metadata/improve-hook', data)
export const getLiveTrends = () => api.get('/growth/trends/live')
export const translateCommentText = (data) => api.post('/cognitive/comments/translate', data)
export const getCommentIdeas = (data) => api.post('/cognitive/comments/ideas', data)
export const diagnoseVideo = (data) => api.post('/cognitive/video/diagnose', data)
export const fixScriptAtTimestamp = (data) => api.post('/cognitive/retention/fix-script', data)
export const generatePostMetadata = (data) => api.post('/cognitive/posts/generate', data)
export const createPost = (formData) => api.post('/cognitive/posts/create', formData, {
  headers: { 'Content-Type': 'multipart/form-data' }
})
export const generateVideoPackage = (data) => api.post('/cognitive/video-studio/generate', data)
export const generateShorts = (data) => api.post('/cognitive/shorts/generate', data)
export const createCommunityPost = (data) => api.post('/cognitive/posts/community', data)
export const getCommunityPosts = (creator_id) => api.get(`/cognitive/posts/community?creator_id=${creator_id}`)

export default api

