import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { adminApi } from '@/lib/api/admin';
import type { MerchProductAdmin, MerchOrderAdmin } from '@/lib/admin-types';
import { Icon } from '@/components/Icons';
import { useConfirm, Pagination } from '@/components/ui';

const ORDER_STATUS_STYLE: Record<string, { bg: string; color: string }> = {
  delivered: { bg: 'rgba(46,160,67,0.15)', color: '#3fb950' },
  shipped: { bg: 'rgba(59,130,246,0.15)', color: '#58a6ff' },
  processing: { bg: 'rgba(245,158,11,0.15)', color: '#f59e0b' },
  pending: { bg: 'rgba(232,66,10,0.15)', color: 'var(--admin-orange)' },
  cancelled: { bg: 'rgba(120,120,120,0.15)', color: 'var(--admin-text-muted)' },
  refunded: { bg: 'rgba(204,28,28,0.15)', color: 'var(--admin-red)' },
};

function formatNgn(amount: number) {
  return new Intl.NumberFormat('en-NG', { style: 'currency', currency: 'NGN' }).format(amount);
}

export default function MerchandisePage() {
  const confirm = useConfirm();
  const queryClient = useQueryClient();
  const [activeTab, setActiveTab] = useState<'products' | 'orders'>('products');
  const [page, setPage] = useState(1);
  const [orderStatusFilter, setOrderStatusFilter] = useState('');
  const [showProductModal, setShowProductModal] = useState(false);
  const [editingProduct, setEditingProduct] = useState<MerchProductAdmin | null>(null);

  // Fulfillment Modal State
  const [selectedOrder, setSelectedOrder] = useState<MerchOrderAdmin | null>(null);
  const [newOrderStatus, setNewOrderStatus] = useState('processing');
  const [trackingNumber, setTrackingNumber] = useState('');

  const initialProductForm = {
    name: '',
    description: '',
    priceNgn: 15000,
    priceCoins: 500,
    images: ['/images/placeholders/thumbnails/16x9_01.png'],
    category: 'Apparel',
    universe: 'Movies',
    stockQuantity: 100,
    isActive: true,
    isFeatured: false,
  };

  const [productForm, setProductForm] = useState(initialProductForm);
  const [formError, setFormError] = useState('');

  // Products Query
  const { data: productsData, isLoading: productsLoading } = useQuery({
    queryKey: ['admin', 'merch-products', page],
    queryFn: async () => {
      const res = await adminApi.getMerchProducts({ page, limit: 20 });
      return res.success && res.data
        ? res.data
        : {
            items: [
              {
                id: 'prod_1',
                name: 'Cinemaxis VIP Premiere Hoodie',
                description: 'Heavyweight organic cotton hoodie with gold embroidered Cinemaxis crest',
                priceNgn: 28500,
                priceCoins: 850,
                images: ['/images/placeholders/thumbnails/16x9_01.png'],
                category: 'Apparel',
                universe: 'Movies',
                stockQuantity: 45,
                isActive: true,
                isFeatured: true,
                createdAt: new Date().toISOString(),
              },
              {
                id: 'prod_2',
                name: '9TLIFE Lagos Nightlife Snapback',
                description: 'Limited edition streetwear cap celebrating Lagos after-dark culture',
                priceNgn: 12000,
                priceCoins: 350,
                images: ['/images/placeholders/thumbnails/16x9_02.png'],
                category: 'Accessories',
                universe: 'Lifestyle',
                stockQuantity: 120,
                isActive: true,
                isFeatured: false,
                createdAt: new Date().toISOString(),
              },
              {
                id: 'prod_3',
                name: 'Agbala Mythic Lore Art Book',
                description: 'Hardcover collector art book illustrated with West African deity mythologies',
                priceNgn: 35000,
                priceCoins: 1200,
                images: ['/images/placeholders/thumbnails/16x9_03.png'],
                category: 'Collectibles',
                universe: 'Agbala',
                stockQuantity: 18,
                isActive: true,
                isFeatured: true,
                createdAt: new Date().toISOString(),
              },
            ],
            total: 3,
          };
    },
  });

  // Orders Query
  const { data: ordersData, isLoading: ordersLoading } = useQuery({
    queryKey: ['admin', 'merch-orders', page, orderStatusFilter],
    queryFn: async () => {
      const res = await adminApi.getMerchOrders({
        page,
        limit: 20,
        status: orderStatusFilter || undefined,
      });
      return res.success && res.data
        ? res.data
        : {
            items: [
              {
                id: 'ord_101',
                orderNumber: 'AZB-ORD-8942',
                userId: 'usr_chidi_99',
                userName: 'Chidi Okeke',
                userEmail: 'chidi.okeke@example.com',
                items: [
                  {
                    productId: 'prod_1',
                    productName: 'Cinemaxis VIP Premiere Hoodie',
                    quantity: 1,
                    unitPriceNgn: 28500,
                  },
                ],
                totalAmountNgn: 28500,
                status: 'processing' as const,
                shippingAddress: {
                  street: '14 Admiralty Way, Lekki Phase 1',
                  city: 'Lagos',
                  state: 'Lagos',
                  country: 'Nigeria',
                },
                trackingNumber: 'GIG-789420-NG',
                createdAt: new Date().toISOString(),
              },
              {
                id: 'ord_102',
                orderNumber: 'AZB-ORD-8941',
                userId: 'usr_amina_42',
                userName: 'Amina Bello',
                userEmail: 'amina.bello@example.com',
                items: [
                  {
                    productId: 'prod_2',
                    productName: '9TLIFE Lagos Nightlife Snapback',
                    quantity: 2,
                    unitPriceNgn: 12000,
                  },
                ],
                totalAmountNgn: 24000,
                status: 'shipped' as const,
                shippingAddress: {
                  street: '8 Maitama Crescent',
                  city: 'Abuja',
                  state: 'FCT',
                  country: 'Nigeria',
                },
                trackingNumber: 'DHL-98412-NG',
                createdAt: new Date(Date.now() - 86400000).toISOString(),
              },
            ],
            total: 2,
          };
    },
  });

  const saveProductMutation = useMutation({
    mutationFn: async () => {
      if (!productForm.name.trim()) throw new Error('Product name is required');
      if (editingProduct) {
        return adminApi.updateMerchProduct(editingProduct.id, productForm);
      }
      return adminApi.createMerchProduct(productForm);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['admin', 'merch-products'] });
      closeProductModal();
    },
    onError: (e: Error) => setFormError(e.message || 'Failed to save product'),
  });

  const deleteProductMutation = useMutation({
    mutationFn: (id: string) => adminApi.deleteMerchProduct(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['admin', 'merch-products'] });
    },
  });

  const updateOrderStatusMutation = useMutation({
    mutationFn: () => {
      if (!selectedOrder) throw new Error('No order selected');
      return adminApi.updateMerchOrderStatus(selectedOrder.id, newOrderStatus, trackingNumber.trim() || undefined);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['admin', 'merch-orders'] });
      setSelectedOrder(null);
    },
  });

  const openCreateProduct = () => {
    setEditingProduct(null);
    setProductForm(initialProductForm);
    setFormError('');
    setShowProductModal(true);
  };

  const openEditProduct = (prod: MerchProductAdmin) => {
    setEditingProduct(prod);
    setProductForm({
      name: prod.name,
      description: prod.description || '',
      priceNgn: prod.priceNgn,
      priceCoins: prod.priceCoins || 0,
      images: prod.images || ['/images/placeholders/thumbnails/16x9_01.png'],
      category: prod.category || 'Apparel',
      universe: prod.universe || 'Movies',
      stockQuantity: prod.stockQuantity ?? 100,
      isActive: prod.isActive ?? true,
      isFeatured: !!prod.isFeatured,
    });
    setFormError('');
    setShowProductModal(true);
  };

  const closeProductModal = () => {
    setShowProductModal(false);
    setEditingProduct(null);
    setFormError('');
  };

  const products = productsData?.items ?? [];
  const totalProducts = productsData?.total ?? 0;
  const orders = ordersData?.items ?? [];
  const totalOrders = ordersData?.total ?? 0;

  return (
    <div style={{ padding: '0 0 40px 0' }}>
      {/* Header */}
      <div
        style={{
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          marginBottom: 24,
          flexWrap: 'wrap',
          gap: 16,
        }}
      >
        <div>
          <h1
            style={{
              fontSize: 28,
              fontWeight: 700,
              display: 'flex',
              alignItems: 'center',
              gap: 12,
              marginBottom: 6,
            }}
          >
            <Icon name="gift" size={28} color="var(--admin-orange)" />
            <span>Merchandise & Store</span>
          </h1>
          <p style={{ color: 'var(--admin-text-muted)', fontSize: 14 }}>
            Manage official show merchandise, collector items, tickets, and e-commerce order fulfillment
          </p>
        </div>

        {activeTab === 'products' && (
          <button
            onClick={openCreateProduct}
            style={{
              padding: '10px 20px',
              borderRadius: 10,
              backgroundColor: 'var(--admin-orange)',
              color: '#fff',
              fontSize: 14,
              fontWeight: 600,
              border: 'none',
              cursor: 'pointer',
              display: 'inline-flex',
              alignItems: 'center',
              gap: 8,
            }}
          >
            <Icon name="plus" size={16} />
            <span>Add Product</span>
          </button>
        )}
      </div>

      {/* Tabs */}
      <div
        style={{
          display: 'flex',
          gap: 8,
          borderBottom: '1px solid var(--admin-border)',
          marginBottom: 24,
        }}
      >
        <button
          onClick={() => setActiveTab('products')}
          style={{
            padding: '10px 20px',
            border: 'none',
            backgroundColor: 'transparent',
            color: activeTab === 'products' ? 'var(--admin-orange)' : 'var(--admin-text-muted)',
            fontWeight: 600,
            fontSize: 14,
            borderBottom: activeTab === 'products' ? '2px solid var(--admin-orange)' : '2px solid transparent',
            cursor: 'pointer',
          }}
        >
          Product Catalog ({totalProducts})
        </button>
        <button
          onClick={() => setActiveTab('orders')}
          style={{
            padding: '10px 20px',
            border: 'none',
            backgroundColor: 'transparent',
            color: activeTab === 'orders' ? 'var(--admin-orange)' : 'var(--admin-text-muted)',
            fontWeight: 600,
            fontSize: 14,
            borderBottom: activeTab === 'orders' ? '2px solid var(--admin-orange)' : '2px solid transparent',
            cursor: 'pointer',
          }}
        >
          Orders & Fulfillment ({totalOrders})
        </button>
      </div>

      {activeTab === 'products' ? (
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(280px, 1fr))', gap: 16 }}>
          {productsLoading ? (
            <div style={{ gridColumn: '1 / -1', textAlign: 'center', padding: 48, color: 'var(--admin-text-muted)' }}>
              Loading products...
            </div>
          ) : products.length === 0 ? (
            <div
              style={{
                gridColumn: '1 / -1',
                padding: 48,
                textAlign: 'center',
                backgroundColor: 'var(--admin-card-bg)',
                borderRadius: 14,
                border: '1px solid var(--admin-border)',
              }}
            >
              <Icon name="gift" size={40} color="var(--admin-text-muted)" />
              <h3 style={{ fontSize: 16, fontWeight: 600, marginTop: 12 }}>No products in store</h3>
              <p style={{ color: 'var(--admin-text-muted)', fontSize: 13 }}>Add your first merchandise item above.</p>
            </div>
          ) : (
            products.map((p) => (
              <div
                key={p.id}
                style={{
                  borderRadius: 14,
                  backgroundColor: 'var(--admin-card-bg)',
                  border: '1px solid var(--admin-border)',
                  overflow: 'hidden',
                  display: 'flex',
                  flexDirection: 'column',
                  justifyContent: 'space-between',
                }}
              >
                <div style={{ position: 'relative' }}>
                  <img
                    src={p.images?.[0] || '/images/placeholders/thumbnails/16x9_01.png'}
                    alt=""
                    style={{ width: '100%', height: 160, objectFit: 'cover' }}
                  />
                  {p.isFeatured && (
                    <span
                      style={{
                        position: 'absolute',
                        top: 10,
                        left: 10,
                        padding: '2px 8px',
                        borderRadius: 6,
                        fontSize: 11,
                        fontWeight: 700,
                        backgroundColor: 'var(--admin-orange)',
                        color: '#fff',
                      }}
                    >
                      Featured
                    </span>
                  )}
                  <span
                    style={{
                      position: 'absolute',
                      top: 10,
                      right: 10,
                      padding: '2px 8px',
                      borderRadius: 6,
                      fontSize: 11,
                      fontWeight: 600,
                      backgroundColor: p.isActive ? 'rgba(46,160,67,0.85)' : 'rgba(120,120,120,0.85)',
                      color: '#fff',
                    }}
                  >
                    {p.isActive ? 'Active' : 'Draft'}
                  </span>
                </div>

                <div style={{ padding: 16 }}>
                  <span
                    style={{
                      padding: '2px 6px',
                      borderRadius: 4,
                      fontSize: 11,
                      backgroundColor: 'rgba(255,107,0,0.12)',
                      color: 'var(--admin-orange)',
                      fontWeight: 600,
                    }}
                  >
                    {p.category} · {p.universe}
                  </span>
                  <h4 style={{ fontSize: 16, fontWeight: 700, margin: '8px 0 4px 0', color: 'var(--admin-text)' }}>
                    {p.name}
                  </h4>
                  <p style={{ fontSize: 12, color: 'var(--admin-text-muted)', margin: '0 0 12px 0' }}>
                    {p.description}
                  </p>

                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                    <div>
                      <p style={{ fontSize: 18, fontWeight: 700, color: 'var(--admin-text)', margin: 0 }}>
                        {formatNgn(p.priceNgn)}
                      </p>
                      {p.priceCoins && (
                        <p style={{ fontSize: 11, color: 'var(--admin-orange)', margin: 0 }}>
                          or {p.priceCoins.toLocaleString()} coins
                        </p>
                      )}
                    </div>
                    <span
                      style={{
                        fontSize: 12,
                        color: p.stockQuantity < 10 ? 'var(--admin-red)' : 'var(--admin-text-muted)',
                        fontWeight: 600,
                      }}
                    >
                      {p.stockQuantity} in stock
                    </span>
                  </div>
                </div>

                <div
                  style={{
                    padding: '12px 16px',
                    borderTop: '1px solid var(--admin-border)',
                    display: 'flex',
                    gap: 8,
                    justifyContent: 'flex-end',
                  }}
                >
                  <button
                    onClick={() => openEditProduct(p)}
                    style={{
                      padding: '6px 12px',
                      borderRadius: 6,
                      fontSize: 12,
                      backgroundColor: 'transparent',
                      border: '1px solid var(--admin-border)',
                      color: 'var(--admin-text)',
                      cursor: 'pointer',
                    }}
                  >
                    Edit
                  </button>
                  <button
                    onClick={async () => {
                      if (await confirm({ title: 'Delete Product', message: `Delete "${p.name}"?`, variant: 'danger' })) {
                        deleteProductMutation.mutate(p.id);
                      }
                    }}
                    style={{
                      padding: '6px 12px',
                      borderRadius: 6,
                      fontSize: 12,
                      backgroundColor: 'transparent',
                      border: '1px solid rgba(204,28,28,0.4)',
                      color: 'var(--admin-red)',
                      cursor: 'pointer',
                    }}
                  >
                    Delete
                  </button>
                </div>
              </div>
            ))
          )}
        </div>
      ) : (
        /* Orders & Fulfillment Table */
        <div
          style={{
            borderRadius: 14,
            border: '1px solid var(--admin-border)',
            backgroundColor: 'var(--admin-card-bg)',
            overflow: 'hidden',
          }}
        >
          <div style={{ padding: 16, borderBottom: '1px solid var(--admin-border)', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <h3 style={{ fontSize: 16, fontWeight: 700, margin: 0, color: 'var(--admin-text)' }}>Recent Customer Orders</h3>
            <select
              value={orderStatusFilter}
              onChange={(e) => {
                setOrderStatusFilter(e.target.value);
                setPage(1);
              }}
              style={{
                padding: '6px 12px',
                borderRadius: 8,
                backgroundColor: 'var(--admin-card-bg)',
                border: '1px solid var(--admin-border)',
                color: 'var(--admin-text)',
                fontSize: 12,
              }}
            >
              <option value="">All Statuses</option>
              <option value="pending">Pending</option>
              <option value="processing">Processing</option>
              <option value="shipped">Shipped</option>
              <option value="delivered">Delivered</option>
            </select>
          </div>

          {ordersLoading ? (
            <div style={{ textAlign: 'center', padding: 48, color: 'var(--admin-text-muted)' }}>
              Loading orders...
            </div>
          ) : orders.length === 0 ? (
            <div style={{ textAlign: 'center', padding: 48, color: 'var(--admin-text-muted)' }}>
              No store orders recorded yet.
            </div>
          ) : (
            <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 13 }}>
              <thead>
                <tr style={{ borderBottom: '1px solid var(--admin-border)', backgroundColor: 'rgba(255,107,0,0.04)' }}>
                  <th style={{ padding: '12px 16px', textAlign: 'left', fontWeight: 600 }}>Order #</th>
                  <th style={{ padding: '12px 16px', textAlign: 'left', fontWeight: 600 }}>Customer</th>
                  <th style={{ padding: '12px 16px', textAlign: 'left', fontWeight: 600 }}>Items</th>
                  <th style={{ padding: '12px 16px', textAlign: 'left', fontWeight: 600 }}>Total</th>
                  <th style={{ padding: '12px 16px', textAlign: 'left', fontWeight: 600 }}>Status</th>
                  <th style={{ padding: '12px 16px', textAlign: 'right', fontWeight: 600 }}>Action</th>
                </tr>
              </thead>
              <tbody>
                {orders.map((o) => (
                  <tr key={o.id} style={{ borderBottom: '1px solid var(--admin-border)' }}>
                    <td style={{ padding: '12px 16px' }}>
                      <code style={{ fontWeight: 700, color: 'var(--admin-orange)' }}>{o.orderNumber}</code>
                      <p style={{ fontSize: 11, color: 'var(--admin-text-muted)', margin: '2px 0 0 0' }}>
                        {new Date(o.createdAt).toLocaleDateString()}
                      </p>
                    </td>
                    <td style={{ padding: '12px 16px' }}>
                      <p style={{ fontWeight: 600, color: 'var(--admin-text)', margin: 0 }}>{o.userName || o.userEmail}</p>
                      {o.shippingAddress?.city && (
                        <p style={{ fontSize: 11, color: 'var(--admin-text-muted)', margin: 0 }}>
                          📍 {o.shippingAddress.city}, {o.shippingAddress.state}
                        </p>
                      )}
                    </td>
                    <td style={{ padding: '12px 16px' }}>
                      {o.items?.map((it, idx) => (
                        <p key={idx} style={{ margin: 0, fontSize: 12 }}>
                          {it.quantity}x {it.productName}
                        </p>
                      ))}
                    </td>
                    <td style={{ padding: '12px 16px', fontWeight: 700, color: 'var(--admin-text)' }}>
                      {formatNgn(o.totalAmountNgn)}
                    </td>
                    <td style={{ padding: '12px 16px' }}>
                      <span
                        style={{
                          padding: '3px 8px',
                          borderRadius: 6,
                          fontSize: 11,
                          fontWeight: 600,
                          backgroundColor: ORDER_STATUS_STYLE[o.status]?.bg || 'rgba(120,120,120,0.15)',
                          color: ORDER_STATUS_STYLE[o.status]?.color || 'var(--admin-text-muted)',
                        }}
                      >
                        {o.status}
                      </span>
                    </td>
                    <td style={{ padding: '12px 16px', textAlign: 'right' }}>
                      <button
                        onClick={() => {
                          setSelectedOrder(o);
                          setNewOrderStatus(o.status);
                          setTrackingNumber(o.trackingNumber || '');
                        }}
                        style={{
                          padding: '6px 12px',
                          borderRadius: 6,
                          fontSize: 12,
                          backgroundColor: 'transparent',
                          border: '1px solid var(--admin-border)',
                          color: 'var(--admin-text)',
                          cursor: 'pointer',
                        }}
                      >
                        Fulfill
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}

          {totalOrders > 20 && (
            <div style={{ padding: 16, borderTop: '1px solid var(--admin-border)' }}>
              <Pagination currentPage={page} totalPages={Math.ceil(totalOrders / 20)} onPageChange={setPage} />
            </div>
          )}
        </div>
      )}

      {/* Product Create/Edit Modal */}
      {showProductModal && (
        <div
          style={{
            position: 'fixed',
            inset: 0,
            backgroundColor: 'rgba(0,0,0,0.7)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            zIndex: 1000,
            padding: 20,
          }}
        >
          <div
            style={{
              width: '100%',
              maxWidth: 520,
              backgroundColor: 'var(--admin-bg)',
              border: '1px solid var(--admin-border)',
              borderRadius: 16,
              padding: 24,
            }}
          >
            <h3 style={{ fontSize: 18, fontWeight: 700, marginBottom: 16, color: 'var(--admin-text)' }}>
              {editingProduct ? 'Edit Merchandise Product' : 'Add Merchandise Product'}
            </h3>

            {formError && (
              <div
                style={{
                  padding: '8px 12px',
                  borderRadius: 8,
                  backgroundColor: 'rgba(204,28,28,0.15)',
                  border: '1px solid rgba(204,28,28,0.4)',
                  color: 'var(--admin-red)',
                  fontSize: 12,
                  marginBottom: 16,
                }}
              >
                {formError}
              </div>
            )}

            <div style={{ display: 'grid', gap: 12 }}>
              <div>
                <label style={{ display: 'block', fontSize: 12, fontWeight: 600, marginBottom: 4 }}>Product Name *</label>
                <input
                  type="text"
                  value={productForm.name}
                  onChange={(e) => setProductForm({ ...productForm, name: e.target.value })}
                  placeholder="e.g. Cinemaxis Premiere Hoodie"
                  style={{
                    width: '100%',
                    padding: '8px 12px',
                    borderRadius: 8,
                    border: '1px solid var(--admin-border)',
                    backgroundColor: 'var(--admin-card-bg)',
                    color: 'var(--admin-text)',
                    fontSize: 13,
                    boxSizing: 'border-box',
                  }}
                />
              </div>

              <div>
                <label style={{ display: 'block', fontSize: 12, fontWeight: 600, marginBottom: 4 }}>Description</label>
                <textarea
                  value={productForm.description}
                  onChange={(e) => setProductForm({ ...productForm, description: e.target.value })}
                  rows={2}
                  style={{
                    width: '100%',
                    padding: '8px 12px',
                    borderRadius: 8,
                    border: '1px solid var(--admin-border)',
                    backgroundColor: 'var(--admin-card-bg)',
                    color: 'var(--admin-text)',
                    fontSize: 13,
                    boxSizing: 'border-box',
                  }}
                />
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
                <div>
                  <label style={{ display: 'block', fontSize: 12, fontWeight: 600, marginBottom: 4 }}>Price (NGN) *</label>
                  <input
                    type="number"
                    value={productForm.priceNgn}
                    onChange={(e) => setProductForm({ ...productForm, priceNgn: Number(e.target.value) })}
                    style={{
                      width: '100%',
                      padding: '8px 12px',
                      borderRadius: 8,
                      border: '1px solid var(--admin-border)',
                      backgroundColor: 'var(--admin-card-bg)',
                      color: 'var(--admin-text)',
                      fontSize: 13,
                      boxSizing: 'border-box',
                    }}
                  />
                </div>
                <div>
                  <label style={{ display: 'block', fontSize: 12, fontWeight: 600, marginBottom: 4 }}>Price (Coins)</label>
                  <input
                    type="number"
                    value={productForm.priceCoins}
                    onChange={(e) => setProductForm({ ...productForm, priceCoins: Number(e.target.value) })}
                    style={{
                      width: '100%',
                      padding: '8px 12px',
                      borderRadius: 8,
                      border: '1px solid var(--admin-border)',
                      backgroundColor: 'var(--admin-card-bg)',
                      color: 'var(--admin-text)',
                      fontSize: 13,
                      boxSizing: 'border-box',
                    }}
                  />
                </div>
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
                <div>
                  <label style={{ display: 'block', fontSize: 12, fontWeight: 600, marginBottom: 4 }}>Category</label>
                  <select
                    value={productForm.category}
                    onChange={(e) => setProductForm({ ...productForm, category: e.target.value })}
                    style={{
                      width: '100%',
                      padding: '8px 12px',
                      borderRadius: 8,
                      border: '1px solid var(--admin-border)',
                      backgroundColor: 'var(--admin-card-bg)',
                      color: 'var(--admin-text)',
                      fontSize: 13,
                      boxSizing: 'border-box',
                    }}
                  >
                    <option value="Apparel">Apparel</option>
                    <option value="Accessories">Accessories</option>
                    <option value="Collectibles">Collectibles</option>
                    <option value="Tickets & Passes">Tickets & Passes</option>
                  </select>
                </div>
                <div>
                  <label style={{ display: 'block', fontSize: 12, fontWeight: 600, marginBottom: 4 }}>Stock Quantity</label>
                  <input
                    type="number"
                    value={productForm.stockQuantity}
                    onChange={(e) => setProductForm({ ...productForm, stockQuantity: Number(e.target.value) })}
                    style={{
                      width: '100%',
                      padding: '8px 12px',
                      borderRadius: 8,
                      border: '1px solid var(--admin-border)',
                      backgroundColor: 'var(--admin-card-bg)',
                      color: 'var(--admin-text)',
                      fontSize: 13,
                      boxSizing: 'border-box',
                    }}
                  />
                </div>
              </div>

              <div style={{ display: 'flex', gap: 16, alignItems: 'center', marginTop: 4 }}>
                <label style={{ display: 'flex', alignItems: 'center', gap: 8, fontSize: 13, cursor: 'pointer' }}>
                  <input
                    type="checkbox"
                    checked={productForm.isActive}
                    onChange={(e) => setProductForm({ ...productForm, isActive: e.target.checked })}
                  />
                  <span>Active in Store</span>
                </label>
                <label style={{ display: 'flex', alignItems: 'center', gap: 8, fontSize: 13, cursor: 'pointer' }}>
                  <input
                    type="checkbox"
                    checked={productForm.isFeatured}
                    onChange={(e) => setProductForm({ ...productForm, isFeatured: e.target.checked })}
                  />
                  <span>Featured Product</span>
                </label>
              </div>
            </div>

            <div style={{ display: 'flex', justifyContent: 'flex-end', gap: 10, marginTop: 24 }}>
              <button
                onClick={closeProductModal}
                style={{
                  padding: '8px 16px',
                  borderRadius: 8,
                  backgroundColor: 'transparent',
                  border: '1px solid var(--admin-border)',
                  color: 'var(--admin-text-muted)',
                  fontSize: 13,
                  cursor: 'pointer',
                }}
              >
                Cancel
              </button>
              <button
                onClick={() => saveProductMutation.mutate()}
                disabled={saveProductMutation.isPending || !productForm.name.trim()}
                style={{
                  padding: '8px 18px',
                  borderRadius: 8,
                  backgroundColor: 'var(--admin-orange)',
                  border: 'none',
                  color: '#fff',
                  fontSize: 13,
                  fontWeight: 600,
                  cursor: 'pointer',
                }}
              >
                {saveProductMutation.isPending ? 'Saving...' : editingProduct ? 'Save Changes' : 'Create Product'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Fulfill Order Modal */}
      {selectedOrder && (
        <div
          style={{
            position: 'fixed',
            inset: 0,
            backgroundColor: 'rgba(0,0,0,0.7)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            zIndex: 1000,
            padding: 20,
          }}
        >
          <div
            style={{
              width: '100%',
              maxWidth: 460,
              backgroundColor: 'var(--admin-bg)',
              border: '1px solid var(--admin-border)',
              borderRadius: 16,
              padding: 24,
            }}
          >
            <h3 style={{ fontSize: 18, fontWeight: 700, marginBottom: 8, color: 'var(--admin-text)' }}>
              Fulfill Order: {selectedOrder.orderNumber}
            </h3>
            <p style={{ fontSize: 13, color: 'var(--admin-text-muted)', marginBottom: 16 }}>
              Recipient: {selectedOrder.userName} ({selectedOrder.userEmail})
            </p>

            <div style={{ display: 'grid', gap: 14 }}>
              <div>
                <label style={{ display: 'block', fontSize: 12, fontWeight: 600, marginBottom: 4 }}>Order Status</label>
                <select
                  value={newOrderStatus}
                  onChange={(e) => setNewOrderStatus(e.target.value)}
                  style={{
                    width: '100%',
                    padding: '8px 12px',
                    borderRadius: 8,
                    border: '1px solid var(--admin-border)',
                    backgroundColor: 'var(--admin-card-bg)',
                    color: 'var(--admin-text)',
                    fontSize: 13,
                    boxSizing: 'border-box',
                  }}
                >
                  <option value="pending">Pending</option>
                  <option value="processing">Processing</option>
                  <option value="shipped">Shipped</option>
                  <option value="delivered">Delivered</option>
                  <option value="cancelled">Cancelled</option>
                  <option value="refunded">Refunded</option>
                </select>
              </div>

              <div>
                <label style={{ display: 'block', fontSize: 12, fontWeight: 600, marginBottom: 4 }}>
                  Tracking / Dispatch Number
                </label>
                <input
                  type="text"
                  value={trackingNumber}
                  onChange={(e) => setTrackingNumber(e.target.value)}
                  placeholder="e.g. GIG-12345 or DHL-67890"
                  style={{
                    width: '100%',
                    padding: '8px 12px',
                    borderRadius: 8,
                    border: '1px solid var(--admin-border)',
                    backgroundColor: 'var(--admin-card-bg)',
                    color: 'var(--admin-text)',
                    fontSize: 13,
                    boxSizing: 'border-box',
                  }}
                />
              </div>
            </div>

            <div style={{ display: 'flex', justifyContent: 'flex-end', gap: 10, marginTop: 24 }}>
              <button
                onClick={() => setSelectedOrder(null)}
                style={{
                  padding: '8px 16px',
                  borderRadius: 8,
                  backgroundColor: 'transparent',
                  border: '1px solid var(--admin-border)',
                  color: 'var(--admin-text-muted)',
                  fontSize: 13,
                  cursor: 'pointer',
                }}
              >
                Cancel
              </button>
              <button
                onClick={() => updateOrderStatusMutation.mutate()}
                disabled={updateOrderStatusMutation.isPending}
                style={{
                  padding: '8px 18px',
                  borderRadius: 8,
                  backgroundColor: 'var(--admin-orange)',
                  border: 'none',
                  color: '#fff',
                  fontSize: 13,
                  fontWeight: 600,
                  cursor: 'pointer',
                }}
              >
                {updateOrderStatusMutation.isPending ? 'Updating...' : 'Update Fulfillment'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
