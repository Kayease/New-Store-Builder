"use client";
import React, { useState, useEffect } from "react";
import { Notices } from "../lib/api";
import { useStoreCtx } from "../contexts/StoreContext";
import {
  Alert,
  AlertTitle,
  IconButton,
  Collapse,
  Box,
  Typography,
} from "@mui/material";
import Icon from "./AppIcon";

interface Notice {
  _id: string;
  title: string;
  content: string;
  startDate?: string;
  endDate?: string;
  isActive: boolean;
  backgroundColor?: string;
  textColor?: string;
}

interface HeaderAnnouncementProps {
  className?: string;
  maxHeight?: number;
  showTitle?: boolean;
  variant?: "filled" | "outlined" | "standard";
}

/**
 * HeaderAnnouncement Component
 * 
 * Displays active announcements at the top of the page.
 * Automatically fetches and displays notices for the current store.
 */
export default function HeaderAnnouncement({
  className = "",
  maxHeight = 200,
  showTitle = true,
  variant = "filled",
}: HeaderAnnouncementProps) {
  const { storeId } = useStoreCtx();
  const [notices, setNotices] = useState<Notice[]>([]);
  const [loading, setLoading] = useState(false);
  const [expanded, setExpanded] = useState<{ [key: string]: boolean }>({});
  const [dismissed, setDismissed] = useState<{ [key: string]: boolean }>({});

  // Load active notices
  useEffect(() => {
    if (storeId) {
      loadActiveNotices();
    }
  }, [storeId]);

  const loadActiveNotices = async () => {
    if (!storeId) return;

    try {
      setLoading(true);
      const response = await Notices.getActive(storeId);
      setNotices(response.notices || []);
    } catch (error) {
      console.error("Failed to load active notices:", error);
    } finally {
      setLoading(false);
    }
  };

  const handleToggleExpand = (noticeId: string) => {
    setExpanded(prev => ({
      ...prev,
      [noticeId]: !prev[noticeId]
    }));
  };

  const handleDismiss = (noticeId: string) => {
    setDismissed(prev => ({
      ...prev,
      [noticeId]: true
    }));
  };

  const isNoticeCurrentlyActive = (notice: Notice) => {
    if (!notice.isActive) return false;
    
    const now = new Date();
    const hasStarted = !notice.startDate || new Date(notice.startDate) <= now;
    const hasNotEnded = !notice.endDate || new Date(notice.endDate) >= now;
    
    return hasStarted && hasNotEnded;
  };

  const activeNotices = notices.filter(notice => 
    isNoticeCurrentlyActive(notice) && !dismissed[notice._id]
  );

  if (loading || activeNotices.length === 0) {
    return null;
  }

  return (
    <Box className={`header-announcements ${className}`}>
      {activeNotices.map((notice) => (
        <Alert
          key={notice._id}
          severity="info"
          variant={variant}
          sx={{
            borderRadius: 0,
            backgroundColor: notice.backgroundColor || undefined,
            color: notice.textColor || undefined,
            '& .MuiAlert-message': {
              width: '100%',
              color: notice.textColor || undefined,
            },
            '& .MuiAlert-icon': {
              color: notice.textColor || undefined,
            },
            '& .MuiAlert-action': {
              color: notice.textColor || undefined,
            },
          }}
          action={
            <Box display="flex" alignItems="center" gap={1}>
              <IconButton
                size="small"
                onClick={() => handleToggleExpand(notice._id)}
                sx={{ color: notice.textColor || 'inherit' }}
              >
                <Icon 
                  name={expanded[notice._id] ? "ChevronUp" : "ChevronDown"} 
                  size={16} 
                />
              </IconButton>
              <IconButton
                size="small"
                onClick={() => handleDismiss(notice._id)}
                sx={{ color: notice.textColor || 'inherit' }}
              >
                <Icon name="X" size={16} />
              </IconButton>
            </Box>
          }
        >
          {showTitle && notice.title && (
            <AlertTitle sx={{ color: notice.textColor || 'inherit' }}>
              {notice.title}
            </AlertTitle>
          )}
          
          <Collapse in={expanded[notice._id] || !notice.title}>
            <Box
              sx={{
                maxHeight: maxHeight,
                overflow: 'auto',
                '& p': { margin: 0 },
                '& p:not(:last-child)': { marginBottom: 1 },
                '& ul, & ol': { margin: 0, paddingLeft: 2 },
                '& h1, & h2, & h3, & h4, & h5, & h6': { 
                  margin: 0, 
                  marginBottom: 1,
                  fontSize: 'inherit',
                  fontWeight: 'bold'
                },
                '& a': { 
                  color: notice.textColor || 'inherit',
                  textDecoration: 'underline'
                },
                '& strong, & b': { fontWeight: 'bold' },
                '& em, & i': { fontStyle: 'italic' },
                '& u': { textDecoration: 'underline' },
                '& s': { textDecoration: 'line-through' },
                '& blockquote': {
                  borderLeft: `3px solid ${notice.textColor || 'currentColor'}`,
                  paddingLeft: 2,
                  margin: 0,
                  marginLeft: 1,
                  fontStyle: 'italic',
                },
                '& code': {
                  backgroundColor: 'rgba(0,0,0,0.1)',
                  padding: '2px 4px',
                  borderRadius: '3px',
                  fontFamily: 'monospace',
                  fontSize: '0.9em',
                },
                '& pre': {
                  backgroundColor: 'rgba(0,0,0,0.1)',
                  padding: 1,
                  borderRadius: 1,
                  overflow: 'auto',
                  margin: 0,
                  '& code': {
                    backgroundColor: 'transparent',
                    padding: 0,
                  },
                },
              }}
              dangerouslySetInnerHTML={{ __html: notice.content }}
            />
          </Collapse>
        </Alert>
      ))}
    </Box>
  );
}

/**
 * Hook to get active notices data
 * Useful for other components that need notice information
 */
export function useActiveNotices() {
  const { storeId } = useStoreCtx();
  const [notices, setNotices] = useState<Notice[]>([]);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (storeId) {
      loadActiveNotices();
    }
  }, [storeId]);

  const loadActiveNotices = async () => {
    if (!storeId) return;

    try {
      setLoading(true);
      const response = await Notices.getActive(storeId);
      setNotices(response.notices || []);
    } catch (error) {
      console.error("Failed to load active notices:", error);
    } finally {
      setLoading(false);
    }
  };

  const isNoticeCurrentlyActive = (notice: Notice) => {
    if (!notice.isActive) return false;
    
    const now = new Date();
    const hasStarted = !notice.startDate || new Date(notice.startDate) <= now;
    const hasNotEnded = !notice.endDate || new Date(notice.endDate) >= now;
    
    return hasStarted && hasNotEnded;
  };

  const activeNotices = notices.filter(isNoticeCurrentlyActive);

  return {
    notices: activeNotices,
    loading,
    refetch: loadActiveNotices,
  };
}
