// Powered by OnSpace.AI
// PayHere WebView Checkout Screen — rendered as a modal from any payment flow

import React, { useRef, useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  Pressable,
  ActivityIndicator,
  Platform,
  Modal,
} from 'react-native';
import { WebView, WebViewNavigation } from 'react-native-webview';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { MaterialIcons } from '@expo/vector-icons';
import { Colors, BorderRadius } from '@/constants/theme';

interface PayHereWebViewProps {
  visible: boolean;
  checkoutHtml: string;
  onSuccess: (paymentId: string) => void;
  onCancel: () => void;
  onError: (msg: string) => void;
  onDismiss: () => void;
}

// PayHere redirects to return_url on success, cancel_url on cancel.
// We detect them by the URL path prefix to handle in-app.
const SUCCESS_URL_FRAGMENT = '/payment/success';
const CANCEL_URL_FRAGMENT = '/payment/cancel';

export function PayHereWebView({
  visible,
  checkoutHtml,
  onSuccess,
  onCancel,
  onError,
  onDismiss,
}: PayHereWebViewProps) {
  const insets = useSafeAreaInsets();
  const [pageLoading, setPageLoading] = useState(true);
  const webViewRef = useRef<WebView>(null);

  const handleNav = (navState: WebViewNavigation) => {
    const url = navState.url || '';

    if (url.includes(SUCCESS_URL_FRAGMENT)) {
      // Extract payment_id from query params if present
      const match = url.match(/[?&]payment_id=([^&]+)/);
      const paymentId = match ? decodeURIComponent(match[1]) : `PH_${Date.now()}`;
      onSuccess(paymentId);
      return;
    }

    if (url.includes(CANCEL_URL_FRAGMENT)) {
      onCancel();
      return;
    }
  };

  return (
    <Modal
      visible={visible}
      animationType="slide"
      presentationStyle="pageSheet"
      onRequestClose={onDismiss}
    >
      <View style={[styles.root, { paddingTop: Platform.OS === 'android' ? insets.top : 0 }]}>
        {/* Header */}
        <View style={styles.header}>
          <View style={styles.headerBrand}>
            <MaterialIcons name="lock" size={16} color={Colors.success} />
            <Text style={styles.headerTitle}>PayHere Secure Checkout</Text>
          </View>
          <Pressable onPress={onDismiss} style={styles.closeBtn} hitSlop={8}>
            <MaterialIcons name="close" size={20} color={Colors.textMuted} />
          </Pressable>
        </View>

        {/* Security strip */}
        <View style={styles.securityStrip}>
          <MaterialIcons name="verified-user" size={12} color={Colors.success} />
          <Text style={styles.securityText}>256-bit SSL encrypted · PayHere LK · LKR</Text>
        </View>

        {/* WebView */}
        <View style={styles.webViewWrap}>
          {pageLoading ? (
            <View style={styles.loadingOverlay}>
              <ActivityIndicator color={Colors.primary} size="large" />
              <Text style={styles.loadingText}>Loading payment gateway...</Text>
            </View>
          ) : null}
          <WebView
            ref={webViewRef}
            source={{ html: checkoutHtml }}
            style={styles.webView}
            javaScriptEnabled
            domStorageEnabled
            startInLoadingState={false}
            onLoadStart={() => setPageLoading(true)}
            onLoadEnd={() => setPageLoading(false)}
            onNavigationStateChange={handleNav}
            onError={(e) => onError(e.nativeEvent.description)}
            mixedContentMode="always"
            allowsInlineMediaPlayback
            scalesPageToFit={Platform.OS === 'android'}
          />
        </View>
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  root: {
    flex: 1,
    backgroundColor: Colors.background,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingVertical: 14,
    borderBottomWidth: 1,
    borderBottomColor: Colors.glassBorder,
    backgroundColor: Colors.surface,
  },
  headerBrand: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  headerTitle: {
    fontFamily: 'PlusJakartaSans_600SemiBold',
    fontSize: 15,
    color: Colors.textPrimary,
    letterSpacing: -0.2,
  },
  closeBtn: {
    width: 34,
    height: 34,
    borderRadius: 17,
    backgroundColor: Colors.glass,
    borderWidth: 1,
    borderColor: Colors.glassBorder,
    alignItems: 'center',
    justifyContent: 'center',
  },
  securityStrip: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    paddingHorizontal: 16,
    paddingVertical: 6,
    backgroundColor: Colors.surfaceElevated,
    borderBottomWidth: 1,
    borderBottomColor: Colors.borderMuted,
  },
  securityText: {
    fontFamily: 'PlusJakartaSans_400Regular',
    fontSize: 11,
    color: Colors.textSubtle,
  },
  webViewWrap: {
    flex: 1,
    position: 'relative',
  },
  loadingOverlay: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: Colors.background,
    alignItems: 'center',
    justifyContent: 'center',
    gap: 14,
    zIndex: 10,
  },
  loadingText: {
    fontFamily: 'PlusJakartaSans_400Regular',
    fontSize: 14,
    color: Colors.textMuted,
  },
  webView: {
    flex: 1,
    backgroundColor: '#fff',
  },
});
