export async function getChannelAnalyticsOverview(analytics, youtube) {
  const { startDate, endDate } = getDateRange(28);
  const prevEnd = new Date(startDate);
  prevEnd.setDate(prevEnd.getDate() - 1);
  const prevStart = new Date(prevEnd);
  prevStart.setDate(prevStart.getDate() - 27);

  const channelRes = await youtube.channels.list({ part: "id,snippet,statistics", mine: true });
  const channelId = channelRes.data.items[0]?.id;
  const channelTitle = channelRes.data.items[0]?.snippet?.title;

  // impressions & CTR come from YouTube Data API (video statistics), not Analytics API
  // Fetch top 10 recent videos for aggregated impressions proxy via Data API
  const [current, prev, daily, traffic, topVideos] = await Promise.all([
    analytics.reports.query({
      ids: `channel==${channelId}`,
      startDate,
      endDate,
      metrics: "views,estimatedMinutesWatched,subscribersGained,subscribersLost,averageViewDuration",
    }),
    analytics.reports.query({
      ids: `channel==${channelId}`,
      startDate: prevStart.toISOString().split("T")[0],
      endDate: prevEnd.toISOString().split("T")[0],
      metrics: "views,estimatedMinutesWatched",
    }),
    analytics.reports.query({
      ids: `channel==${channelId}`,
      startDate,
      endDate,
      metrics: "views",
      dimensions: "day",
      sort: "day",
    }),
    analytics.reports.query({
      ids: `channel==${channelId}`,
      startDate,
      endDate,
      metrics: "views",
      dimensions: "insightTrafficSourceType",
      sort: "-views",
    }),
    analytics.reports.query({
      ids: `channel==${channelId}`,
      startDate,
      endDate,
      metrics: "views,averageViewDuration",
      dimensions: "video",
      sort: "-views",
      maxResults: 5,
    }),
  ]);

  const [curViews = 0, curWatchMin = 0, subGained = 0, subLost = 0, avgDuration = 0] =
    current.data.rows?.[0] || [];
  const [prevViews = 0, prevWatchMin = 0] = prev.data.rows?.[0] || [];

  const viewsChange = prevViews > 0 ? Math.round(((curViews - prevViews) / prevViews) * 100) : 0;
  const watchChange = prevWatchMin > 0 ? Math.round(((curWatchMin - prevWatchMin) / prevWatchMin) * 100) : 0;

  const chartData = (daily.data.rows || []).map((r) => ({ date: r[0], views: r[1] }));

  const totalTrafficViews = (traffic.data.rows || []).reduce((s, r) => s + r[1], 0);
  const trafficSources = (traffic.data.rows || []).map((r) => ({
    source: r[0],
    views: r[1],
    percent: totalTrafficViews > 0 ? parseFloat(((r[1] / totalTrafficViews) * 100).toFixed(1)) : 0,
  }));

  const videoIds = (topVideos.data.rows || []).map((r) => r[0]);
  let videoMeta = {};
  let totalImpressions = 0;
  let weightedCtrSum = 0;
  let ctrCount = 0;
  if (videoIds.length) {
    const vRes = await youtube.videos.list({
      part: "snippet,contentDetails,statistics",
      id: videoIds.join(","),
    });
    vRes.data.items.forEach((v) => {
      videoMeta[v.id] = {
        title: v.snippet.title,
        thumbnail: v.snippet.thumbnails?.medium?.url,
        duration: v.contentDetails.duration,
        published_at: v.snippet.publishedAt,
        view_count: parseInt(v.statistics.viewCount || 0),
      };
    });
  }

  const topContent = (topVideos.data.rows || []).map((r) => ({
    video_id: r[0],
    views: r[1],
    avg_view_duration_seconds: Math.round(r[2] || 0),
    ...(videoMeta[r[0]] || {}),
  }));

  return {
    period: { startDate, endDate, label: "Last 28 days" },
    channel: { id: channelId, title: channelTitle },
    summary: {
      views: curViews,
      views_change_percent: viewsChange,
      watch_time_hours: parseFloat((curWatchMin / 60).toFixed(2)),
      watch_time_change_percent: watchChange,
      net_subscribers: subGained - subLost,
      avg_view_duration_seconds: Math.round(avgDuration),
    },
    chart: chartData,
    traffic_sources: trafficSources,
    top_content: topContent,
  };
}

export async function getAudienceInsights(analytics, youtube) {
  const { startDate, endDate } = getDateRange(28);
  const channelRes = await youtube.channels.list({ part: "id", mine: true });
  const channelId = channelRes.data.items[0]?.id;

  const [subscriberStatus, devices, dailyAudience] = await Promise.all([
    analytics.reports.query({
      ids: `channel==${channelId}`,
      startDate,
      endDate,
      metrics: "estimatedMinutesWatched",
      dimensions: "subscribedStatus",
    }),
    analytics.reports.query({
      ids: `channel==${channelId}`,
      startDate,
      endDate,
      metrics: "estimatedMinutesWatched",
      dimensions: "deviceType",
      sort: "-estimatedMinutesWatched",
    }),
    analytics.reports.query({
      ids: `channel==${channelId}`,
      startDate,
      endDate,
      metrics: "views",
      dimensions: "day",
      sort: "day",
    }),
  ]);

  const totalSubWatch = (subscriberStatus.data.rows || []).reduce((s, r) => s + r[1], 0);
  const subscriberBreakdown = (subscriberStatus.data.rows || []).map((r) => ({
    status: r[0],
    watch_time_hours: parseFloat((r[1] / 60).toFixed(2)),
    percent: totalSubWatch > 0 ? parseFloat(((r[1] / totalSubWatch) * 100).toFixed(1)) : 0,
  }));

  const totalDeviceWatch = (devices.data.rows || []).reduce((s, r) => s + r[1], 0);
  const deviceBreakdown = (devices.data.rows || []).map((r) => ({
    device: r[0],
    watch_time_hours: parseFloat((r[1] / 60).toFixed(2)),
    percent: totalDeviceWatch > 0 ? parseFloat(((r[1] / totalDeviceWatch) * 100).toFixed(1)) : 0,
  }));

  const totalViews = (dailyAudience.data.rows || []).reduce((s, r) => s + r[1], 0);

  return {
    period: { startDate, endDate },
    monthly_audience: totalViews,
    subscriber_breakdown: subscriberBreakdown,
    device_breakdown: deviceBreakdown,
    chart: (dailyAudience.data.rows || []).map((r) => ({ date: r[0], views: r[1] })),
  };
}

export async function getInspirationIdeas() {
  return {
    saved_count: 0,
    notice: "AI tools for brainstorming video ideas have moved to Inspiration.",
    learn_more_url: "https://support.google.com/youtube/answer/15575509",
    ideas: [
      {
        title: "The history of architecture in New York",
        url: "https://studio.youtube.com/channel/UCSUXIxFK-VlZgtGnx9bgvdA/analytics/tab-research/period-default?pageType=TOPIC_PAGE&topic=The%20history%20of%20architecture%20in%20New%20York",
      },
      {
        title: "Easy and fast fluffy pancakes recipe",
        url: "https://studio.youtube.com/channel/UCSUXIxFK-VlZgtGnx9bgvdA/analytics/tab-research/period-default?pageType=TOPIC_PAGE&topic=Easy%20and%20fast%20fluffy%20pancakes%20recipe",
      },
      {
        title: "Best budget noise-cancelling headphones",
        url: "https://studio.youtube.com/channel/UCSUXIxFK-VlZgtGnx9bgvdA/analytics/tab-research/period-default?pageType=TOPIC_PAGE&topic=Best%20budget%20noise-cancelling%20headphones",
      },
    ],
  };
}

function getDateRange(days = 28) {
  const end = new Date();
  const start = new Date();
  start.setDate(start.getDate() - days);
  return {
    startDate: start.toISOString().split("T")[0],
    endDate: end.toISOString().split("T")[0],
  };
}

export async function getStudioInspiration() {
  return {
    heading: "Ideas to get started",
    items: [
      {
        title: "The history of architecture in New York",
        url: "https://studio.youtube.com/channel/UCSUXIxFK-VlZgtGnx9bgvdA/analytics/tab-research/period-default?pageType=TOPIC_PAGE&topic=The%20history%20of%20architecture%20in%20New%20York",
      },
      {
        title: "Easy and fast fluffy pancakes recipe",
        url: "https://studio.youtube.com/channel/UCSUXIxFK-VlZgtGnx9bgvdA/analytics/tab-research/period-default?pageType=TOPIC_PAGE&topic=Easy%20and%20fast%20fluffy%20pancakes%20recipe",
      },
      {
        title: "Best budget noise-cancelling headphones",
        url: "https://studio.youtube.com/channel/UCSUXIxFK-VlZgtGnx9bgvdA/analytics/tab-research/period-default?pageType=TOPIC_PAGE&topic=Best%20budget%20noise-cancelling%20headphones",
      },
    ],
  };
}

export async function getStudioOverview(analytics, youtube) {
  const { startDate, endDate } = getDateRange(28);
  const prevEnd = new Date(startDate);
  prevEnd.setDate(prevEnd.getDate() - 1);
  const prevStart = new Date(prevEnd);
  prevStart.setDate(prevStart.getDate() - 27);

  const channelRes = await youtube.channels.list({ part: "id,snippet", mine: true });
  const channelId = channelRes.data.items[0]?.id;
  const channelTitle = channelRes.data.items[0]?.snippet?.title;

  const [current, prev, daily, traffic, topContent] = await Promise.all([
    analytics.reports.query({
      ids: `channel==${channelId}`,
      startDate,
      endDate,
      metrics: "views,estimatedMinutesWatched,subscribersGained,subscribersLost,averageViewDuration",
    }),
    analytics.reports.query({
      ids: `channel==${channelId}`,
      startDate: prevStart.toISOString().split("T")[0],
      endDate: prevEnd.toISOString().split("T")[0],
      metrics: "views,estimatedMinutesWatched",
    }),
    analytics.reports.query({
      ids: `channel==${channelId}`,
      startDate,
      endDate,
      metrics: "views",
      dimensions: "day",
      sort: "day",
    }),
    analytics.reports.query({
      ids: `channel==${channelId}`,
      startDate,
      endDate,
      metrics: "views",
      dimensions: "insightTrafficSourceType",
      sort: "-views",
    }),
    analytics.reports.query({
      ids: `channel==${channelId}`,
      startDate,
      endDate,
      metrics: "views,averageViewDuration",
      dimensions: "video",
      sort: "-views",
      maxResults: 5,
    }),
  ]);

  const [curViews = 0, curWatchMin = 0, subGained = 0, subLost = 0, avgDuration = 0] =
    current.data.rows?.[0] || [];
  const [prevViews = 0, prevWatchMin = 0] = prev.data.rows?.[0] || [];

  const viewsChange = prevViews > 0 ? Math.round(((curViews - prevViews) / prevViews) * 100) : 0;
  const watchChange = prevWatchMin > 0 ? Math.round(((curWatchMin - prevWatchMin) / prevWatchMin) * 100) : 0;

  const chartData = (daily.data.rows || []).map((r) => ({ date: r[0], views: r[1] }));

  const totalTrafficViews = (traffic.data.rows || []).reduce((s, r) => s + r[1], 0);
  const trafficSources = (traffic.data.rows || []).map((r) => ({
    source: r[0],
    views: r[1],
    percent: totalTrafficViews > 0 ? parseFloat(((r[1] / totalTrafficViews) * 100).toFixed(1)) : 0,
  }));

  const videoIds = (topContent.data.rows || []).map((r) => r[0]);
  let videoMeta = {};
  if (videoIds.length) {
    const vRes = await youtube.videos.list({ part: "snippet,contentDetails", id: videoIds.join(",") });
    vRes.data.items.forEach((v) => {
      videoMeta[v.id] = {
        title: v.snippet.title,
        thumbnail: v.snippet.thumbnails?.medium?.url,
        duration: v.contentDetails.duration,
        published_at: v.snippet.publishedAt,
      };
    });
  }

  const topVideos = (topContent.data.rows || []).map((r) => ({
    video_id: r[0],
    views: r[1],
    avg_view_duration_seconds: Math.round(r[2] || 0),
    ...(videoMeta[r[0]] || {}),
  }));

  return {
    period: { startDate, endDate, days: 28 },
    channel: { id: channelId, title: channelTitle },
    summary: {
      views: curViews,
      views_change_percent: viewsChange,
      watch_time_hours: parseFloat((curWatchMin / 60).toFixed(2)),
      watch_time_change_percent: watchChange,
      net_subscribers: subGained - subLost,
      impressions: 0,
      impressions_ctr: 0,
      avg_view_duration_seconds: Math.round(avgDuration),
    },
    chart: chartData,
    traffic_sources: trafficSources,
    top_content: topVideos,
  };
}

export async function getStudioAudience(analytics, youtube) {
  const { startDate, endDate } = getDateRange(28);
  const channelRes = await youtube.channels.list({ part: "id", mine: true });
  const channelId = channelRes.data.items[0]?.id;

  const [subscriberStatus, devices] = await Promise.all([
    analytics.reports.query({
      ids: `channel==${channelId}`,
      startDate,
      endDate,
      metrics: "estimatedMinutesWatched",
      dimensions: "subscribedStatus",
    }),
    analytics.reports.query({
      ids: `channel==${channelId}`,
      startDate,
      endDate,
      metrics: "estimatedMinutesWatched",
      dimensions: "deviceType",
      sort: "-estimatedMinutesWatched",
    }),
  ]);

  const totalSubWatch = (subscriberStatus.data.rows || []).reduce((s, r) => s + r[1], 0);
  const subscriberBreakdown = (subscriberStatus.data.rows || []).map((r) => ({
    status: r[0],
    watch_time_hours: parseFloat((r[1] / 60).toFixed(2)),
    percent: totalSubWatch > 0 ? parseFloat(((r[1] / totalSubWatch) * 100).toFixed(1)) : 0,
  }));

  const totalDeviceWatch = (devices.data.rows || []).reduce((s, r) => s + r[1], 0);
  const deviceBreakdown = (devices.data.rows || []).map((r) => ({
    device: r[0],
    watch_time_hours: parseFloat((r[1] / 60).toFixed(2)),
    percent: totalDeviceWatch > 0 ? parseFloat(((r[1] / totalDeviceWatch) * 100).toFixed(1)) : 0,
  }));

  return {
    period: { startDate, endDate },
    subscriber_breakdown: subscriberBreakdown,
    device_breakdown: deviceBreakdown,
  };
}

export async function getStudioRealtime(youtube) {
  const channelRes = await youtube.channels.list({ part: "id,statistics,contentDetails", mine: true });
  const channel = channelRes.data.items[0];
  const uploadsPlaylistId = channel.contentDetails.relatedPlaylists.uploads;

  const playlistItemsRes = await youtube.playlistItems.list({
    part: "contentDetails",
    playlistId: uploadsPlaylistId,
    maxResults: 5,
  });

  const ids = playlistItemsRes.data.items.map((i) => i.contentDetails.videoId).join(",");
  const videoRes = await youtube.videos.list({
    part: "snippet,statistics,contentDetails",
    id: ids,
  });

  const latestVideos = videoRes.data.items.map((v) => ({
    video_id: v.id,
    title: v.snippet.title,
    thumbnail: v.snippet.thumbnails?.medium?.url,
    published_at: v.snippet.publishedAt,
    views: parseInt(v.statistics.viewCount || 0),
    likes: parseInt(v.statistics.likeCount || 0),
    comments: parseInt(v.statistics.commentCount || 0),
    duration: v.contentDetails.duration,
    impressions_ctr: null,
  }));

  return {
    subscribers: parseInt(channel.statistics.subscriberCount || 0),
    latest_videos: latestVideos,
    updated_at: new Date().toISOString(),
  };
}
