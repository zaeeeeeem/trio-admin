import { useEffect, useState } from 'react';
import { Card } from '../components/ui/Card';
import { Button } from '../components/ui/Button';
import { Input } from '../components/ui/Input';
import { Table } from '../components/ui/Table';
import { Modal } from '../components/ui/Modal';
import { ProductSelector } from '../components/ui/ProductSelector';
import { api } from '../services/api';
import { toast } from '../utils/toast';
import { Search, Eye, Trash2, Edit2, Plus } from 'lucide-react';
import type { Order, Product, ProductImage, CreateOrderPayload } from '../types';

type OrderItemForm = {
  product: Product | null;
  quantity: number;
};

export function Orders() {
  const [orders, setOrders] = useState<Order[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [paymentFilter, setPaymentFilter] = useState('');
  const [deliveryFilter, setDeliveryFilter] = useState('');
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [showDetailsModal, setShowDetailsModal] = useState(false);
  const [showStatusModal, setShowStatusModal] = useState(false);
  const [selectedOrder, setSelectedOrder] = useState<Order | null>(null);
  const [statusUpdate, setStatusUpdate] = useState<{
    paymentStatus: Order['paymentStatus'];
    deliveryStatus: Order['deliveryStatus'];
  }>({ paymentStatus: 'pending', deliveryStatus: 'processing' });
  const [modalLoading, setModalLoading] = useState(false);
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [createOrderLoading, setCreateOrderLoading] = useState(false);
  const [createOrderForm, setCreateOrderForm] = useState({
    sessionId: '',
    customerEmail: '',
    customerPhone: '',
    shippingAddress: '',
    paymentGateway: '',
    paymentTransactionRef: '',
    items: [{ product: null, quantity: 1 }] as OrderItemForm[],
  });

  const formatDateTime = (value?: string) => {
    if (!value) {
      return 'N/A';
    }
    const date = new Date(value);
    if (Number.isNaN(date.getTime())) {
      return 'N/A';
    }
    return date.toLocaleString();
  };

  const formatCurrency = (value?: number) => {
    if (typeof value !== 'number' || Number.isNaN(value)) {
      return '$0.00';
    }
    return `$${value.toFixed(2)}`;
  };

  const ORDER_ITEM_FALLBACK_IMAGE = 'https://via.placeholder.com/48?text=No+Image';

  const resolveImageSource = (image?: ProductImage | null): string | undefined => {
    if (!image) {
      return undefined;
    }
    const candidates: Array<unknown> = [
      image.viewUrl,
      image.publicUrl,
      image.imageUrl,
      (image as { url?: unknown }).url,
      (image as { Location?: unknown }).Location,
      (image as { location?: unknown }).location,
      (image as { secureUrl?: unknown }).secureUrl,
      (image as { secure_url?: unknown }).secure_url,
      (image as { downloadUrl?: unknown }).downloadUrl,
      (image as { downloadURL?: unknown }).downloadURL,
      (image as { previewUrl?: unknown }).previewUrl,
      (image as { preview_url?: unknown }).preview_url,
    ];

    for (const candidate of candidates) {
      if (typeof candidate === 'string') {
        const trimmed = candidate.trim();
        if (trimmed.length > 0) {
          return trimmed;
        }
      }
    }

    return undefined;
  };

  const resolveProductFallbackImage = (product?: Product | null): string | undefined => {
    if (!product) {
      return undefined;
    }
    const candidates: Array<unknown> = [
      (product as { imageUrl?: unknown }).imageUrl,
      (product as { image_url?: unknown }).image_url,
      (product as { image?: unknown }).image,
      (product as { thumbnail?: unknown }).thumbnail,
      (product as { thumbnailUrl?: unknown }).thumbnailUrl,
      (product as { thumbnail_url?: unknown }).thumbnail_url,
      (product as { coverImage?: unknown }).coverImage,
      (product as { cover_image?: unknown }).cover_image,
      (product as { featuredImage?: unknown }).featuredImage,
      (product as { featured_image?: unknown }).featured_image,
      (product as { primaryImageUrl?: unknown }).primaryImageUrl,
      (product as { primary_image_url?: unknown }).primary_image_url,
      (product as { mainImage?: unknown }).mainImage,
      (product as { main_image?: unknown }).main_image,
      (product as { signedUrl?: unknown }).signedUrl,
      (product as { SignedUrl?: unknown }).SignedUrl,
    ];

    for (const candidate of candidates) {
      if (typeof candidate === 'string') {
        const trimmed = candidate.trim();
        if (trimmed.length > 0) {
          return trimmed;
        }
      }
    }

    return undefined;
  };

  const getOrderItemImage = (item: Order['items'][number]): string => {
    const productImages = item.product?.images ?? [];
    const primary = productImages.find((img) => img.isPrimary) ?? productImages[0];
    return (
      resolveImageSource(primary ?? null) ??
      resolveProductFallbackImage(item.product ?? null) ??
      ORDER_ITEM_FALLBACK_IMAGE
    );
  };

  const extractId = (value: unknown): string => {
    if (typeof value === 'string') {
      return value;
    }
    if (value && typeof value === 'object') {
      const withOid = value as { $oid?: string; oid?: string; id?: string };
      if (typeof withOid.$oid === 'string') return withOid.$oid;
      if (typeof withOid.oid === 'string') return withOid.oid;
      if (typeof withOid.id === 'string') return withOid.id;
      if ('toString' in value && typeof (value as { toString: () => string }).toString === 'function') {
        return (value as { toString: () => string }).toString();
      }
    }
    return '';
  };

  const extractDate = (value: unknown): string => {
    if (typeof value === 'string') {
      return value;
    }
    if (typeof value === 'number') {
      return new Date(value).toISOString();
    }
    if (value && typeof value === 'object') {
      const withDate = value as { $date?: unknown; date?: unknown; toDate?: () => Date };
      if (withDate.$date) {
        const nested = withDate.$date as { $numberLong?: string } | string | number;
        if (typeof nested === 'string') return new Date(nested).toISOString();
        if (typeof nested === 'number') return new Date(nested).toISOString();
        if (nested && typeof nested === 'object' && typeof nested.$numberLong === 'string') {
          return new Date(Number(nested.$numberLong)).toISOString();
        }
      }
      if (withDate.date) {
        const nested = withDate.date as { value?: number } | string | number;
        if (typeof nested === 'string') return new Date(nested).toISOString();
        if (typeof nested === 'number') return new Date(nested).toISOString();
        if (nested && typeof nested === 'object' && typeof nested.value === 'number') {
          return new Date(nested.value).toISOString();
        }
      }
      if (typeof withDate.toDate === 'function') {
        return withDate.toDate().toISOString();
      }
    }
    return new Date().toISOString();
  };

  const PAYMENT_STATUS_VALUES = ['pending', 'paid', 'failed'] as const;
  const DELIVERY_STATUS_VALUES = ['processing', 'delivered', 'cancelled'] as const;

  const getString = (value: unknown): string | undefined => {
    if (typeof value === 'string') {
      const trimmed = value.trim();
      return trimmed.length > 0 ? trimmed : undefined;
    }
    if (typeof value === 'number' && Number.isFinite(value)) {
      return value.toString();
    }
    return undefined;
  };

  const buildAddressString = (value: unknown): string | undefined => {
    if (!value) return undefined;
    if (typeof value === 'string') {
      const trimmed = value.trim();
      return trimmed.length > 0 ? trimmed : undefined;
    }
    if (typeof value === 'object') {
      const addressObject = value as {
        address?: unknown;
        line1?: unknown;
        line2?: unknown;
        street?: unknown;
        street1?: unknown;
        street2?: unknown;
        city?: unknown;
        state?: unknown;
        province?: unknown;
        postalCode?: unknown;
        postal_code?: unknown;
        zip?: unknown;
        country?: unknown;
      };

      const nestedAddress = buildAddressString(addressObject.address);
      const parts = [
        nestedAddress,
        getString(addressObject.line1),
        getString(addressObject.street),
        getString(addressObject.street1),
        getString(addressObject.line2),
        getString(addressObject.street2),
        getString(addressObject.city),
        getString(addressObject.state) ?? getString(addressObject.province),
        getString(addressObject.postalCode) ??
          getString(addressObject.postal_code) ??
          getString(addressObject.zip),
        getString(addressObject.country),
      ].filter(Boolean) as string[];

      if (parts.length > 0) {
        const uniqueParts = parts.filter((part, index) => parts.indexOf(part) === index);
        return uniqueParts.join(', ');
      }
    }
    return undefined;
  };

  const normalizeStatusValue = <T extends readonly string[]>(
    value: unknown,
    allowed: T,
    fallback: T[number]
  ): T[number] => {
    if (typeof value === 'string') {
      const normalized = value.trim().toLowerCase();
      if (allowed.includes(normalized as T[number])) {
        return normalized as T[number];
      }
    }
    return fallback;
  };

  const normalizeOrder = (
    rawOrder: Partial<Order> | (Partial<Order> & { [key: string]: unknown })
  ): Order => {
    const orderRecord = rawOrder as Partial<Order> & { [key: string]: unknown };
    const itemsSource =
      (orderRecord.items as Order['items']) ??
      ((orderRecord as { order_items?: Order['items'] }).order_items ?? []);

    const items = (itemsSource ?? []).map((item) => {
      const rawProduct =
        item.product ??
        (item as { product_id?: Product | string }).product_id ??
        (item as { productId?: Product | string }).productId;

      const product =
        rawProduct && typeof rawProduct === 'object'
          ? (rawProduct as Product)
          : undefined;

      const productId =
        typeof rawProduct === 'string'
          ? rawProduct
          : (item as { productId?: string }).productId ??
            (item as { product_id?: string }).product_id ??
            product?.id ??
            product?._id ??
            '';

      const quantityRaw =
        typeof item.quantity === 'number'
          ? item.quantity
          : Number((item as { quantity?: number | string }).quantity ?? 0);
      const quantity = Number.isFinite(quantityRaw) && quantityRaw > 0 ? quantityRaw : 0;

      const price =
        typeof item.price === 'number'
          ? item.price
          : Number(
              (item as { priceAtTime?: number | string }).priceAtTime ??
                (item as { price_at_time?: number | string }).price_at_time ??
                (item as { unitPrice?: number | string }).unitPrice ??
                0
            );

      const subtotal =
        typeof item.subtotal === 'number'
          ? item.subtotal
          : Number(
              (item as { subtotal?: number | string }).subtotal ??
                (item as { lineTotal?: number | string }).lineTotal ??
                price * quantity
            );

      return {
        ...item,
        productId: productId || (item as { productId?: string }).productId,
        quantity,
        product,
        productName:
          item.productName ??
          (item as { product_name?: string }).product_name ??
          product?.name,
        price: Number.isFinite(price) ? price : 0,
        subtotal: Number.isFinite(subtotal) ? subtotal : Number.isFinite(price * quantity) ? price * quantity : 0,
      };
    });

    const primaryId = extractId(orderRecord.id);
    const secondaryId = extractId((orderRecord as { _id?: unknown })._id);
    const id = primaryId || secondaryId;

    const totalAmountValue =
      typeof orderRecord.totalAmount === 'number'
        ? orderRecord.totalAmount
        : Number(
            (orderRecord as { total_amount?: number | string }).total_amount ??
              (orderRecord as { amount?: number | string }).amount ??
              items.reduce(
                (sum, item) =>
                  sum + (Number.isFinite(item.subtotal) ? (item.subtotal as number) : (item.price as number) * item.quantity),
                0
              )
          );

    const sessionId =
      getString(orderRecord.sessionId) ??
      getString((orderRecord as { session_id?: unknown }).session_id) ??
      (typeof orderRecord.session === 'object' && orderRecord.session
        ? getString((orderRecord.session as { id?: unknown }).id) ??
          getString((orderRecord.session as { sessionId?: unknown }).sessionId)
        : undefined) ??
      '';

    const customerEmail =
      getString(orderRecord.customerEmail) ??
      getString((orderRecord as { customer_email?: unknown }).customer_email) ??
      getString((orderRecord as { email?: unknown }).email) ??
      (typeof orderRecord.customer === 'object' && orderRecord.customer
        ? getString((orderRecord.customer as { email?: unknown }).email)
        : undefined) ??
      (typeof orderRecord.customerDetails === 'object' && orderRecord.customerDetails
        ? getString((orderRecord.customerDetails as { email?: unknown }).email)
        : undefined) ??
      (typeof (orderRecord as { customer_details?: unknown }).customer_details === 'object' &&
      (orderRecord as { customer_details?: unknown }).customer_details
        ? getString(
            ((orderRecord as { customer_details?: { email?: unknown } }).customer_details as {
              email?: unknown;
            }).email
          )
        : undefined) ??
      '';

    const phoneFromCustomer =
      typeof orderRecord.customer === 'object' && orderRecord.customer
        ? getString((orderRecord.customer as { phone?: unknown }).phone) ??
          getString((orderRecord.customer as { phoneNumber?: unknown }).phoneNumber)
        : undefined;
    const phoneFromCustomerDetails =
      typeof orderRecord.customerDetails === 'object' && orderRecord.customerDetails
        ? getString((orderRecord.customerDetails as { phone?: unknown }).phone) ??
          getString((orderRecord.customerDetails as { phoneNumber?: unknown }).phoneNumber)
        : undefined;
    const phoneFromSnake =
      typeof (orderRecord as { customer_details?: unknown }).customer_details === 'object' &&
      (orderRecord as { customer_details?: unknown }).customer_details
        ? getString(
            ((orderRecord as { customer_details?: { phone?: unknown; phoneNumber?: unknown } }).customer_details as {
              phone?: unknown;
              phoneNumber?: unknown;
            }).phone ??
              ((orderRecord as { customer_details?: { phone?: unknown; phoneNumber?: unknown } }).customer_details as {
                phone?: unknown;
                phoneNumber?: unknown;
              }).phoneNumber
          )
        : undefined;

    const customerPhone =
      getString(orderRecord.customerPhone) ??
      getString((orderRecord as { customer_phone?: unknown }).customer_phone) ??
      getString((orderRecord as { phone?: unknown }).phone) ??
      phoneFromCustomer ??
      phoneFromCustomerDetails ??
      phoneFromSnake;

    const shippingCandidate =
      orderRecord.shippingAddress ??
      (orderRecord as { shipping_address?: unknown }).shipping_address ??
      (orderRecord as { shipping?: unknown }).shipping ??
      (orderRecord as { shippingDetails?: unknown }).shippingDetails ??
      (orderRecord as { shipping_details?: unknown }).shipping_details;

    const shippingAddress =
      buildAddressString(shippingCandidate) ??
      (typeof shippingCandidate === 'object' && shippingCandidate
        ? buildAddressString((shippingCandidate as { address?: unknown }).address)
        : undefined) ??
      getString(orderRecord.shippingAddress) ??
      '';

    const paymentStatus = normalizeStatusValue(
      orderRecord.paymentStatus ??
        (orderRecord as { payment_status?: unknown }).payment_status ??
        (typeof orderRecord.status === 'object' && orderRecord.status
          ? (orderRecord.status as { payment?: unknown; paymentStatus?: unknown }).payment ??
            (orderRecord.status as { payment?: unknown; paymentStatus?: unknown }).paymentStatus
          : undefined),
      PAYMENT_STATUS_VALUES,
      'pending'
    );

    const deliveryStatus = normalizeStatusValue(
      orderRecord.deliveryStatus ??
        (orderRecord as { delivery_status?: unknown }).delivery_status ??
        (typeof orderRecord.status === 'object' && orderRecord.status
          ? (orderRecord.status as { delivery?: unknown; deliveryStatus?: unknown }).delivery ??
            (orderRecord.status as { delivery?: unknown; deliveryStatus?: unknown }).deliveryStatus
          : undefined),
      DELIVERY_STATUS_VALUES,
      'processing'
    );

    const normalizedResult = {
      ...(orderRecord as Order),
      id,
      _id: secondaryId || id,
      sessionId,
      customerEmail,
      customerPhone,
      shippingAddress,
      items: items as Order['items'],
      totalAmount: Number.isFinite(totalAmountValue) ? totalAmountValue : 0,
      paymentStatus,
      deliveryStatus,
      paymentDetails:
        orderRecord.paymentDetails ??
        (orderRecord as { payment_details?: unknown }).payment_details,
      createdAt: extractDate(
        orderRecord.createdAt ?? (orderRecord as { created_at?: unknown }).created_at
      ),
      updatedAt: extractDate(
        orderRecord.updatedAt ??
          (orderRecord as { updated_at?: unknown }).updated_at ??
          orderRecord.createdAt ??
          (orderRecord as { created_at?: unknown }).created_at
      ),
    };
    return normalizedResult;
  };

  const resetCreateOrderForm = () => {
    setCreateOrderForm({
      sessionId: '',
      customerEmail: '',
      customerPhone: '',
      shippingAddress: '',
      paymentGateway: '',
      paymentTransactionRef: '',
      items: [{ product: null, quantity: 1 }] as OrderItemForm[],
    });
  };

  useEffect(() => {
    fetchOrders();
  }, [page, search, paymentFilter, deliveryFilter]);

  const fetchOrders = async () => {
    try {
      setLoading(true);
      const filters: any = { page, limit: 10 };
      if (search) filters.customerEmail = search;
      if (paymentFilter) filters.paymentStatus = paymentFilter;
      if (deliveryFilter) filters.deliveryStatus = deliveryFilter;

      const response = await api.getOrders(filters);
      if (response.success) {
        const raw = response.data?.orders ?? [];
        const normalized = raw.map(normalizeOrder);
        setOrders(normalized);
        const pg = response.data?.pagination as
        | { page?: number; limit?: number; total?: number; totalPages?: number }
        | undefined;

        const computedTotalPages =
          typeof pg?.totalPages === 'number'
            ? pg.totalPages
            : typeof (pg as any)?.pages === 'number'
            ? (pg as any).pages
            : typeof pg?.total === 'number' && typeof pg?.limit === 'number' && pg.limit > 0
            ? Math.ceil(pg.total / pg.limit)
            : 1;

        setTotalPages(computedTotalPages);
      }
    } catch (error) {
      toast.error('Failed to load orders');
    } finally {
      setLoading(false);
    }
  };


  const loadOrderDetails = async (order: Order) => {
    const normalizedOrder = normalizeOrder(order);
    const orderId = normalizedOrder.id || normalizedOrder._id;
    if (!orderId) {
      return normalizedOrder;
    }

    const hasDetailedItems =
      Array.isArray(normalizedOrder.items) &&
      normalizedOrder.items.length > 0 &&
      normalizedOrder.items.some((item) => item.productName || item.product) &&
      normalizedOrder.items.some((item) => Number(item.subtotal) > 0 || Number(item.price) > 0);

    if (hasDetailedItems && normalizedOrder.shippingAddress) {
      return normalizedOrder;
    }

    try {
      const response = await api.getOrder(orderId);
      if (response.success && response.data) {
        const data: any = response.data;

        const mapItems = (source: any[]) =>
          source.map((it: any) => {
            const rawProduct =
              it.product ??
              it.productObject ??
              (typeof it.productId === 'object' && it.productId !== null ? it.productId : undefined);

            const productId =
              typeof it.productId === 'string'
                ? it.productId
                : rawProduct?.id || rawProduct?._id || '';

            const quantity = Number(it.quantity) || 0;
            const unitPrice =
              Number(
                it.priceAtTime ??
                  it.price_at_time ??
                  it.unitPrice ??
                  it.unit_price ??
                  it.price ??
                  it.amount ??
                  0
              ) || 0;

            const subtotalCandidate =
              Number(
                it.subtotal ??
                  it.lineTotal ??
                  it.line_total ??
                  it.total ??
                  it.amount_total ??
                  it.totalAmount ??
                  0
              ) || unitPrice * quantity;

            return {
              productId,
              product: rawProduct,
              productName:
                it.productName ??
                it.product_name ??
                rawProduct?.name ??
                rawProduct?.title ??
                undefined,
              quantity,
              price: unitPrice,
              subtotal: Number.isFinite(subtotalCandidate) ? subtotalCandidate : unitPrice * quantity,
            };
          });

        let merged =
          data && typeof data === 'object' && 'order' in data
            ? {
                ...(data.order || {}),
                items: Array.isArray(data.items)
                  ? mapItems(data.items)
                  : Array.isArray(data.order?.items)
                  ? mapItems(data.order.items)
                  : [],
                paymentDetails:
                  data.transaction ??
                  data.transactions ??
                  data.order?.paymentDetails ??
                  data.order?.payment_details,
              }
            : data;

        if (merged && Array.isArray((merged as { items?: unknown }).items)) {
          const itemsWithImages = await Promise.all(
            ((merged as { items: any[] }).items ?? []).map(async (item: any) => {
              const productLike = item.product;
              const rawProductId =
                productLike?.id ??
                productLike?._id ??
                item.productId ??
                item.product_id ??
                (typeof item.productId === 'object' && item.productId !== null
                  ? item.productId._id ?? item.productId.id
                  : undefined);

              const productId = typeof rawProductId === 'string' ? rawProductId : undefined;

              let productData: Product | undefined =
                productLike && typeof productLike === 'object' ? (productLike as Product) : undefined;

              const hasUsableImage =
                (productData?.images ?? []).some((img) => Boolean(resolveImageSource(img))) ||
                Boolean(resolveProductFallbackImage(productData));

              if (!productId && hasUsableImage) {
                return item;
              }

              if (productId && (!productData || !hasUsableImage)) {
                try {
                  const productResponse = await api.getProduct(productId);
                  if (productResponse.success && productResponse.data) {
                    productData = productResponse.data;
                  }
                } catch (productError) {
                  console.error('Failed to fetch product details for order item', productError);
                }
              }

              let finalHasImage =
                (productData?.images ?? []).some((img) => Boolean(resolveImageSource(img))) ||
                Boolean(resolveProductFallbackImage(productData));

              if (productId && !finalHasImage) {
                try {
                  const imagesResponse = await api.getProductImages(productId, { limit: 1 });
                  if (imagesResponse.success && imagesResponse.data?.items?.length) {
                    const images = imagesResponse.data.items;
                    const productNameCandidate =
                      productData?.name ??
                      (productLike as { name?: string })?.name ??
                      (item as { productName?: string }).productName ??
                      (productId ? `Product ${productId.slice(-8)}` : 'Product');
                    const productSlugCandidate =
                      (productData as { slug?: string })?.slug ??
                      (productLike as { slug?: string })?.slug ??
                      (item as { productSlug?: string }).productSlug ??
                      productId ??
                      productNameCandidate;
                    productData = {
                      ...(productData ?? {
                        description: undefined,
                        categoryId: undefined,
                        productType: undefined,
                        price: undefined,
                        discountPercent: undefined,
                        discountedPrice: undefined,
                        quantity: undefined,
                        status: undefined,
                        rating: undefined,
                        totalRatings: undefined,
                        keywords: undefined,
                        features: undefined,
                        legacyVariantAttributes: [],
                        variants: [],
                        createdAt: new Date().toISOString(),
                        updatedAt: new Date().toISOString(),
                      }),
                      id: productData?.id ?? productId,
                      _id: productData?._id ?? productId,
                      name: productNameCandidate,
                      slug: productSlugCandidate,
                      createdAt:
                        (productData as { createdAt?: string })?.createdAt ??
                        new Date().toISOString(),
                      updatedAt:
                        (productData as { updatedAt?: string })?.updatedAt ??
                        new Date().toISOString(),
                      images,
                    } as Product;
                    finalHasImage = images.some((img) => Boolean(resolveImageSource(img)));
                  }
                } catch (imageError) {
                  console.error('Failed to fetch product images for order item', imageError);
                }
              }

              if (productData) {
                return {
                  ...item,
                  product: productData,
                };
              }

              return item;
            })
          );

          merged = {
            ...(merged as Record<string, unknown>),
            items: itemsWithImages,
          };
        }

        return normalizeOrder(merged as Order);
      }
    } catch (error) {
      console.error('Failed to fetch order details', error);
      throw error;
    }

    return normalizedOrder;
  };


  const populateOrderState = (order: Order) => {
    const normalized = normalizeOrder(order);
    setSelectedOrder(normalized);
    setStatusUpdate({
      paymentStatus: normalized.paymentStatus,
      deliveryStatus: normalized.deliveryStatus,
    });
  };

  const handleViewOrder = async (order: Order) => {
    setModalLoading(true);
    const baseOrder = normalizeOrder(order);
    try {
      const detailedOrder = await loadOrderDetails(baseOrder);
      populateOrderState(detailedOrder);
      setShowStatusModal(false);
      setShowDetailsModal(true);
    } catch (error) {
      populateOrderState(baseOrder);
      setShowStatusModal(false);
      setShowDetailsModal(true);
      toast.error('Failed to load order details, showing cached values');
    } finally {
      setModalLoading(false);
    }
  };

  const handleOpenStatusModal = async (order: Order) => {
    setModalLoading(true);
    const baseOrder = normalizeOrder(order);
    try {
      // Always load details first to get the authoritative statuses
      const detailed = await loadOrderDetails(baseOrder);
      const normalized = normalizeOrder(detailed);

      // Set state from the normalized detail BEFORE opening
      setSelectedOrder(normalized);
      setStatusUpdate({
        paymentStatus: normalized.paymentStatus,
        deliveryStatus: normalized.deliveryStatus,
      });

      setShowDetailsModal(false);
      setShowStatusModal(true);
    } catch (error) {
      // Fallback: still open with whatever we have, but normalized
      const normalized = baseOrder;
      setSelectedOrder(normalized);
      setStatusUpdate({
        paymentStatus: normalized.paymentStatus,
        deliveryStatus: normalized.deliveryStatus,
      });
      setShowDetailsModal(false);
      setShowStatusModal(true);
      toast.error('Failed to load full order details, showing cached values');
    } finally {
      setModalLoading(false);
    }
  };

  const handleAddOrderItem = () => {
    setCreateOrderForm((prev) => ({
      ...prev,
      items: [...prev.items, { product: null, quantity: 1 }],
    }));
  };

  const handleRemoveOrderItem = (index: number) => {
    setCreateOrderForm((prev) => ({
      ...prev,
      items: prev.items.filter((_, itemIndex) => itemIndex !== index),
    }));
  };

  const handleItemProductSelect = (index: number, product: Product | null) => {
    setCreateOrderForm((prev) => {
      const items = [...prev.items];
      items[index] = { ...items[index], product };
      return { ...prev, items };
    });
  };

  const handleItemQuantityChange = (index: number, quantity: number) => {
    setCreateOrderForm((prev) => {
      const items = [...prev.items];
      items[index] = { ...items[index], quantity: quantity > 0 ? quantity : 1 };
      return { ...prev, items };
    });
  };

  const handleCloseCreateModal = () => {
    setShowCreateModal(false);
    setCreateOrderLoading(false);
    resetCreateOrderForm();
  };

  const handleCreateOrderSubmit = async () => {
    const trimmedEmail = createOrderForm.customerEmail.trim();
    if (!trimmedEmail) {
      toast.error('Customer email is required');
      return;
    }

    const orderItems = createOrderForm.items
      .filter((item) => item.product && item.quantity > 0)
      .map((item) => ({
        productId: item.product?.id ?? item.product?._id ?? '',
        quantity: item.quantity,
      }))
      .filter((item) => item.productId);

    if (orderItems.length === 0) {
      toast.error('Add at least one product to the order');
      return;
    }

    const payload: CreateOrderPayload = {
      sessionId: createOrderForm.sessionId.trim() || undefined,
      customerEmail: trimmedEmail,
      customerPhone: createOrderForm.customerPhone.trim() || undefined,
      shippingAddress: createOrderForm.shippingAddress.trim() || undefined,
      items: orderItems,
      paymentDetails:
        createOrderForm.paymentGateway.trim() || createOrderForm.paymentTransactionRef.trim()
          ? {
              gateway: createOrderForm.paymentGateway.trim() || 'manual',
              transactionRef: createOrderForm.paymentTransactionRef.trim() || `MANUAL-${Date.now()}`,
            }
          : undefined,
    };

    setCreateOrderLoading(true);
    try {
      if (!payload.sessionId) {
        const sessionResponse = await api.createSession();
        if (!sessionResponse.success || !sessionResponse.data?.sessionId) {
          toast.error(sessionResponse.message || 'Failed to create session');
          setCreateOrderLoading(false);
          return;
        }
        payload.sessionId = sessionResponse.data.sessionId;
      }

      const response = await api.createOrder(payload);
      if (!response.success) {
        toast.error(response.message || 'Failed to create order');
        return;
      }

      toast.success('Order created successfully');
      handleCloseCreateModal();
      await fetchOrders();
      if (response.data) {
        void handleViewOrder(response.data);
      }
    } catch (error: any) {
      toast.error(error.response?.data?.message || 'Failed to create order');
    } finally {
      setCreateOrderLoading(false);
    }
  };

  const handleUpdateStatus = async () => {
    if (!selectedOrder) return;

    const orderId = selectedOrder.id || selectedOrder._id;
    if (!orderId) {
      toast.error('Unable to determine order identifier');
      return;
    }

    try {
      await api.updateOrderStatus(orderId, statusUpdate.paymentStatus, statusUpdate.deliveryStatus);
      toast.success('Order status updated successfully');
      setSelectedOrder((current) =>
        current
          ? {
              ...current,
              paymentStatus: statusUpdate.paymentStatus as Order['paymentStatus'],
              deliveryStatus: statusUpdate.deliveryStatus as Order['deliveryStatus'],
            }
          : current
      );
      setShowStatusModal(false);
      setShowDetailsModal(false);
      fetchOrders();
    } catch (error: any) {
      toast.error('Failed to update order status');
    }
  };

  const handleDelete = async (id: string) => {
    if (!confirm('Are you sure you want to delete this order?')) return;

    try {
      await api.deleteOrder(id);
      toast.success('Order deleted successfully');
      fetchOrders();
    } catch (error) {
      toast.error('Failed to delete order');
    }
  };

  const columns = [
    {
      header: 'Order ID',
      accessor: (row: Order) => (
        <span className="font-mono text-sm">
          {(row.id && row.id.length > 0 ? row.id : row._id || '').slice(-8)}
        </span>
      ),
    },
    {
      header: 'Customer',
      accessor: (row: Order) => (
        <div>
          <p className="font-medium">{row.customerEmail || 'N/A'}</p>
          <p className="text-xs text-[#775596]">{row.customerPhone || 'N/A'}</p>
        </div>
      ),
    },
    {
      header: 'Amount',
      accessor: (row: Order) => formatCurrency(row.totalAmount),
    },
    {
      header: 'Payment',
      accessor: (row: Order) => (
        <span
          className={`px-2 py-1 rounded-full text-xs ${
            row.paymentStatus === 'paid'
              ? 'bg-green-100 text-green-700'
              : row.paymentStatus === 'failed'
              ? 'bg-red-100 text-red-700'
              : 'bg-yellow-100 text-yellow-700'
          }`}
        >
          {row.paymentStatus}
        </span>
      ),
    },
    {
      header: 'Delivery',
      accessor: (row: Order) => (
        <span
          className={`px-2 py-1 rounded-full text-xs ${
            row.deliveryStatus === 'delivered'
              ? 'bg-green-100 text-green-700'
              : row.deliveryStatus === 'cancelled'
              ? 'bg-red-100 text-red-700'
              : 'bg-blue-100 text-blue-700'
          }`}
        >
          {row.deliveryStatus}
        </span>
      ),
    },
    {
      header: 'Date',
      accessor: (row: Order) => formatDateTime(row.createdAt),
    },
    {
      header: 'Actions',
      accessor: (row: Order) => (
        <div className="flex gap-2">
          <Button
            size="sm"
            variant="ghost"
            onClick={() => handleViewOrder(row)}
            title="Preview order"
          >
            <Eye size={16} />
          </Button>
          <Button
            size="sm"
            variant="ghost"
            onClick={() => handleOpenStatusModal(row)}
            title="Edit status"
          >
            <Edit2 size={16} />
          </Button>
          <Button
            size="sm"
            variant="danger"
            onClick={() => {
              const orderId = (row.id && row.id.length > 0 ? row.id : undefined) ?? row._id;
              if (orderId) {
                handleDelete(orderId);
              } else {
                toast.error('Unable to determine order identifier');
              }
            }}
          >
            <Trash2 size={16} />
          </Button>
        </div>
      ),
    },
  ];

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
        <div>
          <h1 className="text-3xl font-bold text-[#1E2934BA] mb-2">Orders</h1>
          <p className="text-[#775596]">Manage customer orders and status</p>
        </div>
        <Button
          onClick={() => {
            resetCreateOrderForm();
            setShowCreateModal(true);
          }}
        >
          <Plus size={18} className="mr-2" />
          Create Order
        </Button>
      </div>

      <Card>
        <div className="mb-6 grid grid-cols-1 md:grid-cols-3 gap-4">
          <div className="relative">
            <Search
              className="absolute left-3 top-1/2 transform -translate-y-1/2 text-[#775596]"
              size={20}
            />
            <Input
              placeholder="Search by email..."
              value={search}
              onChange={(e) => {
                setSearch(e.target.value);
                setPage(1);
              }}
              className="pl-10"
            />
          </div>

          <select
            value={paymentFilter}
            onChange={(e) => {
              setPaymentFilter(e.target.value);
              setPage(1);
            }}
            className="px-4 py-2 border border-[#E5E5E5] rounded-lg focus:outline-none focus:ring-2 focus:ring-[#9268AF]"
          >
            <option value="">All Payment Status</option>
            <option value="pending">Pending</option>
            <option value="paid">Paid</option>
            <option value="failed">Failed</option>
          </select>

          <select
            value={deliveryFilter}
            onChange={(e) => {
              setDeliveryFilter(e.target.value);
              setPage(1);
            }}
            className="px-4 py-2 border border-[#E5E5E5] rounded-lg focus:outline-none focus:ring-2 focus:ring-[#9268AF]"
          >
            <option value="">All Delivery Status</option>
            <option value="processing">Processing</option>
            <option value="delivered">Delivered</option>
            <option value="cancelled">Cancelled</option>
          </select>
        </div>

        <Table data={orders} columns={columns} loading={loading} emptyMessage="No orders found" />

        {totalPages > 1 && (
          <div className="mt-6 flex justify-center gap-2">
            <Button variant="ghost" disabled={page === 1} onClick={() => setPage(page - 1)}>
              Previous
            </Button>
            <span className="px-4 py-2 text-[#1E2934BA]">
              Page {page} of {totalPages}
            </span>
            <Button
              variant="ghost"
              disabled={page === totalPages}
              onClick={() => setPage(page + 1)}
            >
              Next
            </Button>
          </div>
        )}
      </Card>

      <Modal
        isOpen={showCreateModal}
        onClose={handleCloseCreateModal}
        title="Create Order"
        size="lg"
      >
        <div className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <Input
              label="Customer Email"
              type="email"
              value={createOrderForm.customerEmail}
              onChange={(e) =>
                setCreateOrderForm((prev) => ({ ...prev, customerEmail: e.target.value }))
              }
              placeholder="customer@example.com"
              required
            />
            <Input
              label="Customer Phone (optional)"
              value={createOrderForm.customerPhone}
              onChange={(e) =>
                setCreateOrderForm((prev) => ({ ...prev, customerPhone: e.target.value }))
              }
              placeholder="+1234567890"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-[#1E2934BA] mb-1">
              Shipping Address (optional)
            </label>
            <textarea
              value={createOrderForm.shippingAddress}
              onChange={(e) =>
                setCreateOrderForm((prev) => ({ ...prev, shippingAddress: e.target.value }))
              }
              className="w-full px-4 py-2 border border-[#E5E5E5] rounded-lg focus:outline-none focus:ring-2 focus:ring-[#9268AF]"
              rows={3}
              placeholder="123 Main St, City, Country"
            />
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <Input
              label="Session ID (optional)"
              value={createOrderForm.sessionId}
              onChange={(e) =>
                setCreateOrderForm((prev) => ({ ...prev, sessionId: e.target.value }))
              }
              placeholder="manual-session-id"
            />
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <Input
                label="Payment Gateway"
                value={createOrderForm.paymentGateway}
                onChange={(e) =>
                  setCreateOrderForm((prev) => ({ ...prev, paymentGateway: e.target.value }))
                }
                placeholder="Manual"
              />
              <Input
                label="Transaction Ref"
                value={createOrderForm.paymentTransactionRef}
                onChange={(e) =>
                  setCreateOrderForm((prev) => ({
                    ...prev,
                    paymentTransactionRef: e.target.value,
                  }))
                }
                placeholder="TXN123"
              />
            </div>
          </div>

          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <p className="text-sm font-medium text-[#1E2934BA]">Order Items</p>
              <Button variant="secondary" size="sm" onClick={handleAddOrderItem}>
                <Plus size={16} className="mr-2" /> Add Item
              </Button>
            </div>

            {createOrderForm.items.map((item, index) => (
              <div
                key={`order-item-${index}`}
                className="flex flex-col md:flex-row gap-3 items-start md:items-end"
              >
                <div className="flex-1 w-full">
                  {index === 0 && (
                    <p className="text-sm font-medium text-[#1E2934BA] mb-1">Product</p>
                  )}
                  <ProductSelector
                    selectedProduct={item.product}
                    onSelect={(product) => handleItemProductSelect(index, product)}
                    placeholder="Search product..."
                  />
                </div>
                <div className="w-full md:w-32">
                  <Input
                    label={index === 0 ? 'Quantity' : undefined}
                    type="number"
                    min={1}
                    value={item.quantity}
                    onChange={(e) =>
                      handleItemQuantityChange(index, parseInt(e.target.value, 10) || 1)
                    }
                  />
                </div>
                {createOrderForm.items.length > 1 && (
                  <Button
                    size="sm"
                    variant="danger"
                    onClick={() => handleRemoveOrderItem(index)}
                    title="Remove item"
                  >
                    <Trash2 size={16} />
                  </Button>
                )}
              </div>
            ))}
          </div>

          <div className="flex justify-end gap-3 pt-4 border-t border-[#F2DFFF]">
            <Button variant="ghost" onClick={handleCloseCreateModal} disabled={createOrderLoading}>
              Cancel
            </Button>
            <Button onClick={handleCreateOrderSubmit} loading={createOrderLoading}>
              Create Order
            </Button>
          </div>
        </div>
      </Modal>

      <Modal
        isOpen={showDetailsModal}
        onClose={() => {
          setShowDetailsModal(false);
          setSelectedOrder(null);
          setModalLoading(false);
        }}
        title="Order Details"
        size="lg"
      >
        {modalLoading ? (
          <div className="py-16 text-center text-[#775596]">Loading order details...</div>
        ) : selectedOrder ? (
          <div className="space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <p className="text-sm text-[#775596] mb-1">Order ID</p>
                <p className="font-mono text-sm break-all">
                  {(selectedOrder.id ?? selectedOrder._id) || 'N/A'}
                </p>
              </div>
              <div>
                <p className="text-sm text-[#775596] mb-1">Date</p>
                <p>{formatDateTime(selectedOrder.createdAt)}</p>
              </div>
              <div>
                <p className="text-sm text-[#775596] mb-1">Customer Email</p>
                <p>{selectedOrder.customerEmail || 'N/A'}</p>
              </div>
              <div>
                <p className="text-sm text-[#775596] mb-1">Customer Phone</p>
                <p>{selectedOrder.customerPhone || 'N/A'}</p>
              </div>
              <div>
                <p className="text-sm text-[#775596] mb-1">Session ID</p>
                <p className="font-mono text-xs break-all">
                  {selectedOrder.sessionId || 'N/A'}
                </p>
              </div>
              <div>
                <p className="text-sm text-[#775596] mb-1">Shipping Address</p>
                <p>{selectedOrder.shippingAddress || 'N/A'}</p>
              </div>
            </div>

            <div>
              <p className="text-sm text-[#775596] mb-2">Order Items</p>
              <div className="space-y-2">
                {(selectedOrder.items ?? []).length === 0 ? (
                  <div className="p-3 bg-[#F2DFFF] bg-opacity-30 rounded-lg text-sm text-[#775596]">
                    No items attached to this order.
                  </div>
                ) : (
                  (selectedOrder.items ?? []).map((item, index) => (
                    <div
                      key={`${item.productId}-${index}`}
                      className="flex justify-between gap-4 p-3 bg-[#F2DFFF] bg-opacity-30 rounded-lg"
                    >
                      <div className="flex items-start gap-3">
                        <img
                          src={getOrderItemImage(item)}
                          alt={item.product?.name ?? item.productName ?? 'Product image'}
                          className="h-12 w-12 rounded-lg object-cover"
                        />
                        <div>
                          <p className="font-medium text-[#1E2934BA]">
                            {item.product?.name ?? item.productName ?? 'Unknown product'}
                          </p>
                          <p className="text-xs text-[#775596]">
                            Qty: {item.quantity}
                          </p>
                        </div>
                      </div>
                      <div className="text-right">
                        <p className="text-sm text-[#775596]">
                          Unit: {formatCurrency(item.price)}
                        </p>
                        <p className="font-medium text-[#1E2934BA]">
                          {formatCurrency(item.subtotal)}
                        </p>
                      </div>
                    </div>
                  ))
                )}
              </div>
            </div>

            <div className="flex justify-between items-center text-lg font-bold">
              <span>Total Amount</span>
              <span>{formatCurrency(selectedOrder.totalAmount)}</span>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <p className="text-sm text-[#775596] mb-1">Payment Status</p>
                <span className="font-medium text-[#1E2934BA] capitalize">
                  {selectedOrder.paymentStatus}
                </span>
              </div>
              <div>
                <p className="text-sm text-[#775596] mb-1">Delivery Status</p>
                <span className="font-medium text-[#1E2934BA] capitalize">
                  {selectedOrder.deliveryStatus}
                </span>
              </div>
            </div>

            <div className="flex justify-end gap-3 pt-4 border-t border-[#F2DFFF]">
              <Button
                variant="ghost"
                onClick={() => {
                  setShowDetailsModal(false);
                  setModalLoading(false);
                  setSelectedOrder(null);
                }}
              >
                Close
              </Button>
              <Button onClick={() => handleOpenStatusModal(selectedOrder)}>Edit Status</Button>
            </div>
          </div>
        ) : (
          <div className="py-16 text-center text-[#775596]">Order details unavailable.</div>
        )}
      </Modal>

      <Modal
        isOpen={showStatusModal}
        onClose={() => {
          setShowStatusModal(false);
          setSelectedOrder(null);
          setModalLoading(false);
        }}
        title="Update Order Status"
      >
        {modalLoading ? (
          <div className="py-10 text-center text-[#775596]">Loading order details...</div>
        ) : selectedOrder ? (
          <div className="space-y-4">
            <div>
              <p className="text-sm text-[#775596] mb-1">Order</p>
              <p className="font-medium text-[#1E2934BA]">
                {(selectedOrder.id ?? selectedOrder._id)?.slice(-8)} — {selectedOrder.customerEmail}
              </p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-[#1E2934BA] mb-1">
                  Payment Status
                </label>
                <select
                  value={statusUpdate.paymentStatus}
                  onChange={(e) =>
                    setStatusUpdate((prev) => ({
                      ...prev,
                      paymentStatus: e.target.value as Order['paymentStatus'],
                    }))
                  }
                  className="w-full px-4 py-2 border border-[#E5E5E5] rounded-lg focus:outline-none focus:ring-2 focus:ring-[#9268AF]"
                >
                  <option value="pending">Pending</option>
                  <option value="paid">Paid</option>
                  <option value="failed">Failed</option>
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium text-[#1E2934BA] mb-1">
                  Delivery Status
                </label>
                <select
                  value={statusUpdate.deliveryStatus}
                  onChange={(e) =>
                    setStatusUpdate((prev) => ({
                      ...prev,
                      deliveryStatus: e.target.value as Order['deliveryStatus'],
                    }))
                  }
                  className="w-full px-4 py-2 border border-[#E5E5E5] rounded-lg focus:outline-none focus:ring-2 focus:ring-[#9268AF]"
                >
                  <option value="processing">Processing</option>
                  <option value="delivered">Delivered</option>
                  <option value="cancelled">Cancelled</option>
                </select>
              </div>
            </div>

            <div className="flex justify-end gap-3 pt-4 border-t border-[#F2DFFF]">
              <Button
                variant="ghost"
                onClick={() => {
                  setShowStatusModal(false);
                  setModalLoading(false);
                  setSelectedOrder(null);
                }}
              >
                Cancel
              </Button>
              <Button onClick={handleUpdateStatus}>Update Status</Button>
            </div>
          </div>
        ) : (
          <div className="py-10 text-center text-[#775596]">Order details unavailable.</div>
        )}
      </Modal>
    </div>
  );
}
