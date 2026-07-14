import {
  Announcement,
  AnnouncementAPI,
  JoinableGroup,
  JoinableGroupAPI,
  Module,
  ModuleAPI,
  ModuleContent,
  ModuleContentAPI,
  ModuleGroup,
  ModuleGroupAPI,
} from './ModuleTypes';

function toModule(moduleAPI: ModuleAPI): Module {
  return {
    id: moduleAPI.id,
    name: moduleAPI.name,
    initials: moduleAPI.initials,
    avatarColor: moduleAPI.avatar_color,
    unreadCount: moduleAPI.unread_count,
  };
}

function toAnnouncement(announcementAPI: AnnouncementAPI): Announcement {
  return {
    lastMessage: announcementAPI.last_message,
    date: announcementAPI.date,
  };
}

function toModuleGroup(groupAPI: ModuleGroupAPI): ModuleGroup {
  return {
    id: groupAPI.id,
    name: groupAPI.name,
    initials: groupAPI.initials,
    avatarColor: groupAPI.avatar_color,
    lastMessage: groupAPI.last_message,
    time: groupAPI.time,
    unreadCount: groupAPI.unread_count,
    muted: groupAPI.is_muted,
  };
}

function toJoinableGroup(groupAPI: JoinableGroupAPI): JoinableGroup {
  return {
    id: groupAPI.id,
    name: groupAPI.name,
    initials: groupAPI.initials,
    avatarColor: groupAPI.avatar_color,
    membersCount: groupAPI.members_count,
  };
}

function toModuleContent(contentAPI: ModuleContentAPI): ModuleContent {
  return {
    announcement: toAnnouncement(contentAPI.announcement),
    myGroups: contentAPI.my_groups.map(toModuleGroup),
    joinableGroups: contentAPI.joinable_groups.map(toJoinableGroup),
  };
}

export const moduleAdapter = {
  toModule,
  toAnnouncement,
  toModuleGroup,
  toJoinableGroup,
  toModuleContent,
};
