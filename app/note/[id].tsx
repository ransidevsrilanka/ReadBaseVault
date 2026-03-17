// Powered by OnSpace.AI
import React, { useEffect, useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  Pressable,
  ActivityIndicator,
  Dimensions,
} from 'react-native';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { MaterialIcons } from '@expo/vector-icons';
import { WebView } from 'react-native-webview';
import { useAuth } from '@/hooks/useAuth';
import { GlassCard, VaultButton } from '@/components';
import { Colors, BorderRadius } from '@/constants/theme';
import { fetchServePDF } from '@/services/content.service';

const { width, height } = Dimensions.get('window');

export default function NoteViewerScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const { user, profile, enrollment } = useAuth();
  const [pdfData, setPdfData] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const insets = useSafeAreaInsets();
  const router = useRouter();

  const displayName = profile?.full_name || user?.email || 'User';

  const loadPDF = async () => {
    setLoading(true);
    setError(null);
    try {
      const data = await fetchServePDF(id);
      setPdfData(data);
    } catch (err: any) {
      setError(err?.message || 'Failed to load document. Please try again.');
    }
    setLoading(false);
  };

  useEffect(() => { loadPDF(); }, [id]);

  // Watermark overlay HTML injected into WebView
  const watermarkHtml = pdfData?.watermark ? `
    <style>
      .watermark {
        position: fixed;
        top: 0; left: 0; right: 0; bottom: 0;
        pointer-events: none;
        z-index: 9999;
        overflow: hidden;
      }
      .watermark-text {
        position: absolute;
        color: rgba(255,255,255,${pdfData.watermark.opacity || 0.15});
        font-size: 13px;
        font-family: Arial, sans-serif;
        white-space: nowrap;
        transform: rotate(-35deg);
        user-select: none;
        -webkit-user-select: none;
      }
    </style>
    <div class="watermark" id="wm"></div>
    <script>
      const wm = document.getElementById('wm');
      const text = "${pdfData.watermark.text.replace(/"/g, '\\"')}";
      for (let y = -200; y < window.innerHeight + 200; y += 120) {
        for (let x = -200; x < window.innerWidth + 200; x += 280) {
          const el = document.createElement('div');
          el.className = 'watermark-text';
          el.innerText = text;
          el.style.top = y + 'px';
          el.style.left = x + 'px';
          wm.appendChild(el);
        }
      }
    </script>
  ` : '';

  // PDF viewer HTML
  const viewerHtml = pdfData ? `
    <!DOCTYPE html>
    <html>
    <head>
      <meta name="viewport" content="width=device-width, initial-scale=1.0, maximum-scale=1.0">
      <style>
        * { margin: 0; padding: 0; box-sizing: border-box; }
        body { background: #0a0a04; width: 100%; height: 100vh; overflow: hidden; }
        iframe { width: 100%; height: 100vh; border: none; }
        ${pdfData.watermark ? `
        .watermark {
          position: fixed; top: 0; left: 0; right: 0; bottom: 0;
          pointer-events: none; z-index: 9999; overflow: hidden;
        }
        .wt {
          position: absolute; color: rgba(255,255,255,${pdfData.watermark.opacity || 0.15});
          font-size: 12px; font-family: Arial; white-space: nowrap;
          transform: rotate(-35deg); user-select: none; -webkit-user-select: none;
        }
        ` : ''}
      </style>
    </head>
    <body>
      <iframe src="${pdfData.signedUrl}" allowfullscreen></iframe>
      ${pdfData.watermark ? `
      <div class="watermark" id="wm"></div>
      <script>
        const wm = document.getElementById('wm');
        const text = "${(pdfData.watermark.text || '').replace(/"/g, '\\"')}";
        for (let y = -200; y < window.screen.height + 400; y += 100) {
          for (let x = -200; x < window.screen.width + 400; x += 240) {
            const el = document.createElement('div');
            el.className = 'wt';
            el.innerText = text;
            el.style.top = y + 'px';
            el.style.left = x + 'px';
            wm.appendChild(el);
          }
        }
      <\/script>
      ` : ''}
    </body>
    </html>
  ` : '';

  return (
    <View style={[styles.root, { paddingTop: insets.top }]}>
      {/* Header */}
      <View style={styles.header}>
        <Pressable onPress={() => router.back()} style={styles.backBtn} hitSlop={8}>
          <MaterialIcons name="arrow-back" size={22} color={Colors.textPrimary} />
        </Pressable>
        <Text style={styles.headerTitle} numberOfLines={1}>
          {pdfData?.noteTitle || 'Document'}
        </Text>
        <View style={styles.secureChip}>
          <MaterialIcons name="lock" size={12} color={Colors.success} />
          <Text style={styles.secureText}>Secure</Text>
        </View>
      </View>

      {/* Watermark notice */}
      <View style={styles.watermarkBanner}>
        <MaterialIcons name="fingerprint" size={13} color={Colors.textSubtle} />
        <Text style={styles.watermarkText}>
          Watermarked for {user?.email}
        </Text>
      </View>

      {/* Content */}
      {loading ? (
        <View style={styles.loadingView}>
          <ActivityIndicator color={Colors.primary} size="large" />
          <Text style={styles.loadingText}>Unlocking document...</Text>
        </View>
      ) : error ? (
        <View style={styles.errorView}>
          <GlassCard style={styles.errorCard}>
            <MaterialIcons name="error-outline" size={40} color={Colors.error} />
            <Text style={styles.errorTitle}>Failed to Load</Text>
            <Text style={styles.errorText}>{error}</Text>
            <VaultButton label="Try Again" onPress={loadPDF} fullWidth />
          </GlassCard>
        </View>
      ) : (
        <WebView
          source={{ html: viewerHtml }}
          style={styles.webview}
          javaScriptEnabled
          allowFileAccess={false}
          allowUniversalAccessFromFileURLs={false}
          mediaPlaybackRequiresUserAction
          onError={() => setError('Failed to render document.')}
        />
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1, backgroundColor: Colors.background },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: Colors.glassBorder,
  },
  backBtn: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: Colors.glass,
    borderWidth: 1,
    borderColor: Colors.glassBorder,
    alignItems: 'center',
    justifyContent: 'center',
  },
  headerTitle: {
    flex: 1,
    fontFamily: 'PlusJakartaSans_600SemiBold',
    fontSize: 15,
    color: Colors.textPrimary,
    letterSpacing: -0.2,
  },
  secureChip: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 3,
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: BorderRadius.full,
    backgroundColor: Colors.successLight,
    borderWidth: 1,
    borderColor: Colors.success + '40',
  },
  secureText: {
    fontFamily: 'PlusJakartaSans_600SemiBold',
    fontSize: 10,
    color: Colors.success,
  },
  watermarkBanner: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    paddingHorizontal: 16,
    paddingVertical: 6,
    backgroundColor: Colors.surfaceElevated,
    borderBottomWidth: 1,
    borderBottomColor: Colors.borderMuted,
  },
  watermarkText: {
    fontFamily: 'PlusJakartaSans_400Regular',
    fontSize: 11,
    color: Colors.textSubtle,
  },
  loadingView: { flex: 1, alignItems: 'center', justifyContent: 'center', gap: 14 },
  loadingText: {
    fontFamily: 'PlusJakartaSans_400Regular',
    fontSize: 14,
    color: Colors.textMuted,
  },
  errorView: { flex: 1, padding: 20, justifyContent: 'center' },
  errorCard: { alignItems: 'center', gap: 12, paddingVertical: 32 },
  errorTitle: {
    fontFamily: 'PlusJakartaSans_700Bold',
    fontSize: 18,
    color: Colors.textPrimary,
  },
  errorText: {
    fontFamily: 'PlusJakartaSans_400Regular',
    fontSize: 14,
    color: Colors.textMuted,
    textAlign: 'center',
    lineHeight: 20,
  },
  webview: { flex: 1, backgroundColor: Colors.background },
});
