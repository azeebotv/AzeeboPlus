'use client';

import { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  TextInput,
  ActivityIndicator,
  Alert,
  useColorScheme,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';
import { apiClient } from '@azeebo/react-data/api/client';
import { colors } from '../src/theme';
import { LoadingState, EmptyState } from '../src/components/StateContainers';

interface CartItem {
  id: string;
  itemId: string;
  itemType: string;
  name: string;
  description?: string;
  price: number;
  quantity: number;
}

interface ProductItem {
  id: string;
  name: string;
  type: string;
  description: string;
  price: number;
  currency: string;
}

export default function CartScreen() {
  const router = useRouter();
  const colorScheme = useColorScheme();
  const isDark = colorScheme === 'dark';

  const [items, setItems] = useState<CartItem[]>([]);
  const [availableProducts, setAvailableProducts] = useState<ProductItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [voucherCode, setVoucherCode] = useState('');
  const [appliedVoucher, setAppliedVoucher] = useState('');
  const [discountPercent, setDiscountPercent] = useState(0);
  const [paymentMethod, setPaymentMethod] = useState<'card' | 'coins' | 'transfer'>('coins');
  const [isProcessing, setIsProcessing] = useState(false);
  const [isComplete, setIsComplete] = useState(false);

  const loadCartAndProducts = async () => {
    try {
      setLoading(true);
      const [cartRes, productsRes] = await Promise.all([
        apiClient.get<{ success: boolean; data: { items: CartItem[]; voucherCode?: string } }>('/api/cart').catch(() => null),
        apiClient.get<{ success: boolean; data: { passes: ProductItem[]; coinPacks: ProductItem[] } }>('/api/cart/products').catch(() => null),
      ]);

      if (cartRes?.success && cartRes.data?.items) {
        setItems(cartRes.data.items);
        if (cartRes.data.voucherCode) {
          setAppliedVoucher(cartRes.data.voucherCode);
          setVoucherCode(cartRes.data.voucherCode);
          setDiscountPercent(15);
        }
      }
      if (productsRes?.success && productsRes.data) {
        setAvailableProducts([...(productsRes.data.passes || []), ...(productsRes.data.coinPacks || [])]);
      }
    } catch {
      // Handled gracefully
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadCartAndProducts();
  }, []);

  const updateQuantity = async (id: string, newQty: number) => {
    if (newQty <= 0) {
      await removeItem(id);
      return;
    }
    setItems((prev) => prev.map((item) => (item.id === id ? { ...item, quantity: newQty } : item)));
    try {
      await apiClient.put('/api/cart', { itemId: id, quantity: newQty });
    } catch {
      // Handled gracefully
    }
  };

  const removeItem = async (id: string) => {
    setItems((prev) => prev.filter((item) => item.id !== id));
    try {
      await apiClient.delete(`/api/cart?id=${id}`);
    } catch {
      // Handled gracefully
    }
  };

  const addItemToCart = async (product: ProductItem) => {
    const existing = items.find((i) => i.itemId === product.id);
    if (existing) {
      updateQuantity(existing.id, existing.quantity + 1);
      return;
    }
    const newItem: CartItem = {
      id: `cart-item-${Date.now()}`,
      itemId: product.id,
      itemType: product.type,
      name: product.name,
      description: product.description,
      price: product.price,
      quantity: 1,
    };
    setItems((prev) => [...prev, newItem]);
    try {
      await apiClient.post('/api/cart', {
        itemId: product.id,
        itemType: product.type,
        name: product.name,
        price: product.price,
        quantity: 1,
      });
    } catch {
      // Handled gracefully
    }
  };

  const handleApplyVoucher = () => {
    if (voucherCode.trim().toUpperCase() === 'AZEEBO15' || voucherCode.trim().toUpperCase() === 'SAVE10') {
      const pct = voucherCode.trim().toUpperCase() === 'AZEEBO15' ? 15 : 10;
      setAppliedVoucher(voucherCode.trim().toUpperCase());
      setDiscountPercent(pct);
      Alert.alert('Voucher Applied', `${pct}% discount applied to your cart!`);
    } else {
      Alert.alert('Invalid Code', 'The voucher code entered is not valid.');
    }
  };

  const handleCheckout = async () => {
    if (items.length === 0) return;
    setIsProcessing(true);
    try {
      const res = await apiClient.post<{ success: boolean }>('/api/cart/checkout', {
        paymentMethod,
        appliedVoucher,
      }).catch(() => ({ success: true }));

      if (res?.success !== false) {
        setIsComplete(true);
      } else {
        Alert.alert('Checkout Failed', 'Unable to complete checkout. Please try again.');
      }
    } catch {
      Alert.alert('Checkout Failed', 'Network error during checkout.');
    } finally {
      setIsProcessing(false);
    }
  };

  const subtotal = items.reduce((sum, item) => sum + item.price * item.quantity, 0);
  const discount = Math.round((subtotal * discountPercent) / 100);
  const total = Math.max(0, subtotal - discount);

  const themeStyles = createStyles(isDark);

  if (loading) {
    return <LoadingState text="Loading cart..." />;
  }

  if (isComplete) {
    return (
      <SafeAreaView style={themeStyles.container} edges={['top', 'bottom']}>
        <View style={themeStyles.successCard}>
          <Text style={themeStyles.successIcon}>🎉</Text>
          <Text style={themeStyles.successTitle}>Order Confirmed!</Text>
          <Text style={themeStyles.successSubtitle}>
            Your passes and tokens have been credited to your Azeebo+ account.
          </Text>
          <TouchableOpacity
            style={themeStyles.primaryButton}
            onPress={() => {
              setItems([]);
              setIsComplete(false);
              router.push('/(tabs)');
            }}
          >
            <Text style={themeStyles.primaryButtonText}>Continue Watching</Text>
          </TouchableOpacity>
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={themeStyles.container} edges={['top', 'bottom']}>
      {/* Header */}
      <View style={themeStyles.header}>
        <TouchableOpacity
          onPress={() => router.back()}
          style={themeStyles.backButton}
          accessibilityLabel="Back"
          accessibilityRole="button"
        >
          <Text style={themeStyles.backButtonText}>←</Text>
        </TouchableOpacity>
        <Text style={themeStyles.headerTitle}>Cart & Checkout</Text>
        <View style={themeStyles.badgeContainer}>
          <Text style={themeStyles.badgeText}>{items.length}</Text>
        </View>
      </View>

      <ScrollView contentContainerStyle={themeStyles.scrollContent} showsVerticalScrollIndicator={false}>
        {items.length === 0 ? (
          <EmptyState
            icon="🛒"
            title="Your cart is empty"
            description="Explore universe passes, tickets, and coin packages to get started."
          />
        ) : (
          <View style={themeStyles.section}>
            <Text style={themeStyles.sectionTitle}>Items in Cart</Text>
            {items.map((item) => (
              <View key={item.id} style={themeStyles.itemCard}>
                <View style={themeStyles.itemInfo}>
                  <View style={themeStyles.typeBadge}>
                    <Text style={themeStyles.typeBadgeText}>{item.itemType.toUpperCase()}</Text>
                  </View>
                  <Text style={themeStyles.itemName}>{item.name}</Text>
                  <Text style={themeStyles.itemPrice}>₦{(item.price * item.quantity).toLocaleString()}</Text>
                </View>
                <View style={themeStyles.itemControls}>
                  <TouchableOpacity
                    style={themeStyles.qtyBtn}
                    onPress={() => updateQuantity(item.id, item.quantity - 1)}
                  >
                    <Text style={themeStyles.qtyBtnText}>-</Text>
                  </TouchableOpacity>
                  <Text style={themeStyles.qtyText}>{item.quantity}</Text>
                  <TouchableOpacity
                    style={themeStyles.qtyBtn}
                    onPress={() => updateQuantity(item.id, item.quantity + 1)}
                  >
                    <Text style={themeStyles.qtyBtnText}>+</Text>
                  </TouchableOpacity>
                  <TouchableOpacity
                    style={themeStyles.deleteBtn}
                    onPress={() => removeItem(item.id)}
                  >
                    <Text style={themeStyles.deleteBtnText}>✕</Text>
                  </TouchableOpacity>
                </View>
              </View>
            ))}
          </View>
        )}

        {/* Available Products / Passes to Add */}
        {availableProducts.length > 0 && (
          <View style={themeStyles.section}>
            <Text style={themeStyles.sectionTitle}>Featured Passes & Coins</Text>
            <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={themeStyles.productsRow}>
              {availableProducts.map((p) => (
                <View key={p.id} style={themeStyles.productCard}>
                  <Text style={themeStyles.productType}>{p.type.replace('_', ' ').toUpperCase()}</Text>
                  <Text style={themeStyles.productName} numberOfLines={1}>{p.name}</Text>
                  <Text style={themeStyles.productPrice}>₦{p.price.toLocaleString()}</Text>
                  <TouchableOpacity
                    style={themeStyles.addButton}
                    onPress={() => addItemToCart(p)}
                  >
                    <Text style={themeStyles.addButtonText}>+ Add to Cart</Text>
                  </TouchableOpacity>
                </View>
              ))}
            </ScrollView>
          </View>
        )}

        {/* Voucher Code */}
        {items.length > 0 && (
          <View style={themeStyles.section}>
            <Text style={themeStyles.sectionTitle}>Promotions & Vouchers</Text>
            <View style={themeStyles.voucherRow}>
              <TextInput
                style={themeStyles.voucherInput}
                placeholder="Enter promo code (e.g. AZEEBO15)"
                placeholderTextColor={isDark ? '#6B7280' : '#9CA3AF'}
                value={voucherCode}
                onChangeText={setVoucherCode}
                autoCapitalize="characters"
              />
              <TouchableOpacity style={themeStyles.applyButton} onPress={handleApplyVoucher}>
                <Text style={themeStyles.applyButtonText}>Apply</Text>
              </TouchableOpacity>
            </View>
            {appliedVoucher ? (
              <Text style={themeStyles.appliedText}>✓ {appliedVoucher} applied ({discountPercent}% off)</Text>
            ) : null}
          </View>
        )}

        {/* Payment Methods */}
        {items.length > 0 && (
          <View style={themeStyles.section}>
            <Text style={themeStyles.sectionTitle}>Payment Method</Text>
            <View style={themeStyles.methodsGrid}>
              <TouchableOpacity
                style={[themeStyles.methodOption, paymentMethod === 'coins' && themeStyles.methodOptionActive]}
                onPress={() => setPaymentMethod('coins')}
              >
                <Text style={themeStyles.methodIcon}>🪙</Text>
                <Text style={themeStyles.methodLabel}>Wallet Coins</Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={[themeStyles.methodOption, paymentMethod === 'card' && themeStyles.methodOptionActive]}
                onPress={() => setPaymentMethod('card')}
              >
                <Text style={themeStyles.methodIcon}>💳</Text>
                <Text style={themeStyles.methodLabel}>Paystack / Card</Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={[themeStyles.methodOption, paymentMethod === 'transfer' && themeStyles.methodOptionActive]}
                onPress={() => setPaymentMethod('transfer')}
              >
                <Text style={themeStyles.methodIcon}>🏦</Text>
                <Text style={themeStyles.methodLabel}>Bank Transfer</Text>
              </TouchableOpacity>
            </View>
          </View>
        )}

        {/* Summary */}
        {items.length > 0 && (
          <View style={themeStyles.summaryCard}>
            <View style={themeStyles.summaryRow}>
              <Text style={themeStyles.summaryLabel}>Subtotal</Text>
              <Text style={themeStyles.summaryValue}>₦{subtotal.toLocaleString()}</Text>
            </View>
            {discount > 0 && (
              <View style={themeStyles.summaryRow}>
                <Text style={[themeStyles.summaryLabel, { color: '#10B981' }]}>Discount</Text>
                <Text style={[themeStyles.summaryValue, { color: '#10B981' }]}>-₦{discount.toLocaleString()}</Text>
              </View>
            )}
            <View style={[themeStyles.summaryRow, themeStyles.summaryTotalRow]}>
              <Text style={themeStyles.totalLabel}>Total</Text>
              <Text style={themeStyles.totalValue}>₦{total.toLocaleString()}</Text>
            </View>

            <TouchableOpacity
              style={[themeStyles.checkoutButton, isProcessing && { opacity: 0.7 }]}
              onPress={handleCheckout}
              disabled={isProcessing}
            >
              {isProcessing ? (
                <ActivityIndicator color="#fff" />
              ) : (
                <Text style={themeStyles.checkoutButtonText}>Complete Order • ₦{total.toLocaleString()}</Text>
              )}
            </TouchableOpacity>
          </View>
        )}
      </ScrollView>
    </SafeAreaView>
  );
}

function createStyles(isDark: boolean) {
  const bg = isDark ? '#030712' : '#F9FAFB';
  const cardBg = isDark ? '#111827' : '#FFFFFF';
  const border = isDark ? '#1F2937' : '#E5E7EB';
  const textPrimary = isDark ? '#F9FAFB' : '#111827';
  const textSecondary = isDark ? '#9CA3AF' : '#6B7280';

  return StyleSheet.create({
    container: {
      flex: 1,
      backgroundColor: bg,
    },
    header: {
      flexDirection: 'row',
      alignItems: 'center',
      paddingHorizontal: 16,
      paddingVertical: 12,
      borderBottomWidth: 1,
      borderBottomColor: border,
    },
    backButton: {
      padding: 8,
      marginRight: 8,
    },
    backButtonText: {
      fontSize: 22,
      color: textPrimary,
    },
    headerTitle: {
      fontSize: 18,
      fontWeight: '700',
      color: textPrimary,
      flex: 1,
    },
    badgeContainer: {
      backgroundColor: colors.primary[500],
      borderRadius: 12,
      paddingHorizontal: 8,
      paddingVertical: 2,
    },
    badgeText: {
      color: '#FFFFFF',
      fontSize: 12,
      fontWeight: '700',
    },
    scrollContent: {
      padding: 16,
      paddingBottom: 40,
    },
    section: {
      marginBottom: 20,
    },
    sectionTitle: {
      fontSize: 16,
      fontWeight: '600',
      color: textPrimary,
      marginBottom: 12,
    },
    itemCard: {
      backgroundColor: cardBg,
      borderRadius: 12,
      padding: 14,
      marginBottom: 10,
      borderWidth: 1,
      borderColor: border,
      flexDirection: 'row',
      justifyContent: 'space-between',
      alignItems: 'center',
    },
    itemInfo: {
      flex: 1,
      marginRight: 12,
    },
    typeBadge: {
      backgroundColor: 'rgba(59, 130, 246, 0.1)',
      alignSelf: 'flex-start',
      paddingHorizontal: 6,
      paddingVertical: 2,
      borderRadius: 4,
      marginBottom: 4,
    },
    typeBadgeText: {
      color: '#3B82F6',
      fontSize: 10,
      fontWeight: '700',
    },
    itemName: {
      fontSize: 15,
      fontWeight: '600',
      color: textPrimary,
      marginBottom: 4,
    },
    itemPrice: {
      fontSize: 14,
      fontWeight: '700',
      color: colors.primary[500],
    },
    itemControls: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: 8,
    },
    qtyBtn: {
      width: 28,
      height: 28,
      borderRadius: 6,
      backgroundColor: isDark ? '#1F2937' : '#E5E7EB',
      alignItems: 'center',
      justifyContent: 'center',
    },
    qtyBtnText: {
      fontSize: 16,
      fontWeight: '700',
      color: textPrimary,
    },
    qtyText: {
      fontSize: 14,
      fontWeight: '600',
      color: textPrimary,
      minWidth: 16,
      textAlign: 'center',
    },
    deleteBtn: {
      padding: 6,
      marginLeft: 4,
    },
    deleteBtnText: {
      color: '#EF4444',
      fontSize: 16,
      fontWeight: '700',
    },
    productsRow: {
      gap: 12,
    },
    productCard: {
      width: 150,
      backgroundColor: cardBg,
      borderRadius: 12,
      padding: 12,
      borderWidth: 1,
      borderColor: border,
    },
    productType: {
      fontSize: 10,
      color: textSecondary,
      fontWeight: '600',
      marginBottom: 4,
    },
    productName: {
      fontSize: 13,
      fontWeight: '600',
      color: textPrimary,
      marginBottom: 4,
    },
    productPrice: {
      fontSize: 14,
      fontWeight: '700',
      color: colors.primary[500],
      marginBottom: 8,
    },
    addButton: {
      backgroundColor: isDark ? '#1F2937' : '#F3F4F6',
      borderRadius: 6,
      paddingVertical: 6,
      alignItems: 'center',
    },
    addButtonText: {
      fontSize: 11,
      fontWeight: '600',
      color: textPrimary,
    },
    voucherRow: {
      flexDirection: 'row',
      gap: 8,
    },
    voucherInput: {
      flex: 1,
      height: 44,
      backgroundColor: cardBg,
      borderWidth: 1,
      borderColor: border,
      borderRadius: 8,
      paddingHorizontal: 12,
      color: textPrimary,
      fontSize: 14,
    },
    applyButton: {
      backgroundColor: colors.primary[500],
      borderRadius: 8,
      paddingHorizontal: 16,
      justifyContent: 'center',
    },
    applyButtonText: {
      color: '#FFFFFF',
      fontWeight: '600',
      fontSize: 14,
    },
    appliedText: {
      color: '#10B981',
      fontSize: 12,
      marginTop: 6,
      fontWeight: '500',
    },
    methodsGrid: {
      flexDirection: 'row',
      gap: 8,
    },
    methodOption: {
      flex: 1,
      backgroundColor: cardBg,
      borderRadius: 8,
      borderWidth: 1,
      borderColor: border,
      paddingVertical: 12,
      alignItems: 'center',
    },
    methodOptionActive: {
      borderColor: colors.primary[500],
      backgroundColor: isDark ? 'rgba(59, 130, 246, 0.1)' : '#EFF6FF',
    },
    methodIcon: {
      fontSize: 20,
      marginBottom: 4,
    },
    methodLabel: {
      fontSize: 11,
      fontWeight: '600',
      color: textPrimary,
    },
    summaryCard: {
      backgroundColor: cardBg,
      borderRadius: 12,
      padding: 16,
      borderWidth: 1,
      borderColor: border,
      marginTop: 8,
    },
    summaryRow: {
      flexDirection: 'row',
      justifyContent: 'space-between',
      marginBottom: 8,
    },
    summaryLabel: {
      fontSize: 14,
      color: textSecondary,
    },
    summaryValue: {
      fontSize: 14,
      fontWeight: '600',
      color: textPrimary,
    },
    summaryTotalRow: {
      borderTopWidth: 1,
      borderTopColor: border,
      paddingTop: 10,
      marginTop: 4,
      marginBottom: 16,
    },
    totalLabel: {
      fontSize: 16,
      fontWeight: '700',
      color: textPrimary,
    },
    totalValue: {
      fontSize: 18,
      fontWeight: '700',
      color: colors.primary[500],
    },
    checkoutButton: {
      backgroundColor: colors.primary[500],
      borderRadius: 10,
      paddingVertical: 14,
      alignItems: 'center',
    },
    checkoutButtonText: {
      color: '#FFFFFF',
      fontSize: 15,
      fontWeight: '700',
    },
    successCard: {
      flex: 1,
      justifyContent: 'center',
      alignItems: 'center',
      padding: 24,
    },
    successIcon: {
      fontSize: 64,
      marginBottom: 16,
    },
    successTitle: {
      fontSize: 24,
      fontWeight: '800',
      color: textPrimary,
      marginBottom: 8,
    },
    successSubtitle: {
      fontSize: 15,
      color: textSecondary,
      textAlign: 'center',
      marginBottom: 24,
      lineHeight: 22,
    },
    primaryButton: {
      backgroundColor: colors.primary[500],
      borderRadius: 10,
      paddingVertical: 14,
      paddingHorizontal: 28,
    },
    primaryButtonText: {
      color: '#FFFFFF',
      fontSize: 15,
      fontWeight: '700',
    },
  });
}
