import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, FlatList, TextInput, TouchableOpacity, Image, Modal, Alert, ActivityIndicator } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { colors } from '../theme/colors';
import api from '../services/api';
import { getProductImage } from '../utils/imageHelper';

export default function CustomerProductsScreen({ navigation, route }) {
  const [products, setProducts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [buyModalVisible, setBuyModalVisible] = useState(false);
  const [selectedProduct, setSelectedProduct] = useState(null);
  
  // Form State
  const [name, setName] = useState('');
  const [phone, setPhone] = useState('');
  const [address, setAddress] = useState('');

  useEffect(() => {
    fetchProducts();
  }, []);

  const fetchProducts = async () => {
    try {
      setLoading(true);
      const res = await api.get('/products');
      if (res.data.success) {
        setProducts(res.data.products);
      }
    } catch (error) {
      console.log('Error fetching products:', error);
    } finally {
      setLoading(false);
    }
  };

  // Handle incoming route params if navigated via "BUY" from home screen
  useEffect(() => {
    if (route.params?.action === 'buy' && route.params?.product) {
      handleBuyClick(route.params.product);
    }
  }, [route.params]);

  const filteredProducts = products.filter(p => 
    (p.title || p.name || '').toLowerCase().includes(searchQuery.toLowerCase()) ||
    (p.description || '').toLowerCase().includes(searchQuery.toLowerCase())
  );

  const handleBuyClick = (product) => {
    setSelectedProduct(product);
    setBuyModalVisible(true);
  };

  const submitPurchase = async () => {
    if (!name || !phone || !address) {
      Alert.alert('Error', 'Please fill all details.');
      return;
    }
    
    try {
      if (selectedProduct?._id) {
        await api.post('/purchases', {
          productId: selectedProduct._id,
          name,
          phone,
          deliveryAddress: address,
          notes: ''
        });
      }
    } catch (e) {
      console.log('Purchase save error:', e?.message);
    }
    
    setBuyModalVisible(false);
    setName(''); setPhone(''); setAddress('');

    Alert.alert(
      'Request Received', 
      'Your request has been received. Our representative will contact you shortly.',
      [{ text: 'OK' }]
    );
  };

  const renderProduct = ({ item }) => (
    <View style={styles.productRow}>
      <Image source={getProductImage(item)} style={styles.productImage} resizeMode="contain" />
      <View style={styles.productDetails}>
        <View style={styles.titleRow}>
          <Text style={styles.productTitle}>{item.title || item.name}</Text>
          <View style={styles.categoryBadge}>
            <Text style={styles.categoryBadgeText}>{item.category || 'AC'}</Text>
          </View>
        </View>
        {item.description ? (
          <Text style={styles.productDesc} numberOfLines={2}>{item.description}</Text>
        ) : null}
        <View style={styles.priceRow}>
          <Text style={styles.productPrice}>Rs {item.price?.toLocaleString?.() || item.price}</Text>
          <TouchableOpacity style={styles.buyBtn} onPress={() => handleBuyClick(item)}>
            <Text style={styles.buyBtnText}>BUY</Text>
          </TouchableOpacity>
        </View>
      </View>
    </View>
  );

  return (
    <SafeAreaView style={styles.container} edges={['top']}>
      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity style={styles.backBtn} onPress={() => navigation.goBack()}>
          <Ionicons name="chevron-back" size={24} color="#FFF" />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Products Catalog</Text>
        <View style={styles.rightPlaceholder} />
      </View>

      <View style={styles.contentContainer}>
        {/* Search Bar */}
        <View style={styles.searchContainer}>
          <Ionicons name="search" size={20} color="#A0AEC0" style={styles.searchIcon} />
          <TextInput
            style={styles.searchInput}
            placeholder="Search air conditioners..."
            placeholderTextColor="#A0AEC0"
            value={searchQuery}
            onChangeText={setSearchQuery}
          />
        </View>

        <FlatList
          data={filteredProducts}
          keyExtractor={item => item._id}
          renderItem={renderProduct}
          contentContainerStyle={styles.listContent}
          showsVerticalScrollIndicator={false}
        />
      </View>

      {/* Buy Modal */}
      <Modal
        animationType="slide"
        transparent={true}
        visible={buyModalVisible}
        onRequestClose={() => setBuyModalVisible(false)}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>Purchase Request</Text>
              <TouchableOpacity onPress={() => setBuyModalVisible(false)}>
                <Ionicons name="close" size={24} color="#333" />
              </TouchableOpacity>
            </View>

            {selectedProduct && (
              <View style={styles.selectedProductBox}>
                <Image source={getProductImage(selectedProduct)} style={styles.modalProdImg} resizeMode="contain" />
                <View style={styles.modalProdInfo}>
                  <Text style={styles.modalProdTitle}>{selectedProduct.title || selectedProduct.name}</Text>
                  <Text style={styles.modalProdPrice}>Rs {selectedProduct.price?.toLocaleString?.() || selectedProduct.price}</Text>
                </View>
              </View>
            )}

            <Text style={styles.inputLabel}>Full Name</Text>
            <TextInput style={styles.textInput} placeholder="e.g. John Doe" value={name} onChangeText={setName} />

            <Text style={styles.inputLabel}>Phone Number</Text>
            <TextInput style={styles.textInput} placeholder="e.g. +971 50 123 4567" keyboardType="phone-pad" value={phone} onChangeText={setPhone} />

            <Text style={styles.inputLabel}>Delivery Address</Text>
            <TextInput style={styles.textArea} placeholder="Enter your full address" multiline={true} numberOfLines={3} textAlignVertical="top" value={address} onChangeText={setAddress} />

            <TouchableOpacity style={styles.submitBtn} onPress={submitPurchase}>
              <Text style={styles.submitBtnText}>Submit Request</Text>
            </TouchableOpacity>
          </View>
        </View>
      </Modal>

    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#002B5B' },
  header: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingHorizontal: 15, paddingVertical: 15, backgroundColor: '#002B5B' },
  backBtn: { width: 30 },
  headerTitle: { fontSize: 18, fontWeight: 'bold', color: '#FFF' },
  rightPlaceholder: { width: 30 },
  contentContainer: { flex: 1, backgroundColor: '#F8F9FA', borderTopLeftRadius: 25, borderTopRightRadius: 25, marginTop: 5, overflow: 'hidden' },
  
  searchContainer: { flexDirection: 'row', alignItems: 'center', backgroundColor: '#FFF', margin: 20, marginBottom: 10, borderRadius: 12, paddingHorizontal: 15, height: 50, borderWidth: 1, borderColor: '#E2E8F0' },
  searchIcon: { marginRight: 10 },
  searchInput: { flex: 1, fontSize: 15, color: '#333' },
  
  listContent: { paddingHorizontal: 20, paddingBottom: 20 },
  productRow: { flexDirection: 'row', backgroundColor: '#FFF', borderRadius: 15, padding: 15, marginBottom: 15, shadowColor: '#000', shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.05, shadowRadius: 5, elevation: 2, borderWidth: 1, borderColor: '#F0F0F0', alignItems: 'center' },
  productImage: { width: 85, height: 85, borderRadius: 10, backgroundColor: '#FFF' },
  productDetails: { flex: 1, marginLeft: 15, justifyContent: 'center' },
  titleRow: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginBottom: 4 },
  categoryBadge: { backgroundColor: '#E0E7FF', paddingHorizontal: 8, paddingVertical: 2, borderRadius: 6 },
  categoryBadgeText: { fontSize: 10, color: colors.primary, fontWeight: 'bold' },
  productTitle: { fontSize: 15, fontWeight: 'bold', color: '#002B5B', flex: 1, marginRight: 5 },
  productDesc: { fontSize: 12, color: '#666', marginBottom: 8, lineHeight: 16 },
  priceRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  productPrice: { fontSize: 16, fontWeight: '900', color: '#007BFF' },
  buyBtn: { backgroundColor: '#007BFF', paddingHorizontal: 15, paddingVertical: 6, borderRadius: 8 },
  buyBtnText: { color: '#FFF', fontSize: 11, fontWeight: 'bold' },

  modalOverlay: { flex: 1, backgroundColor: 'rgba(0,0,0,0.5)', justifyContent: 'flex-end' },
  modalContent: { backgroundColor: '#FFF', borderTopLeftRadius: 25, borderTopRightRadius: 25, padding: 25, maxHeight: '90%' },
  modalHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 20 },
  modalTitle: { fontSize: 18, fontWeight: 'bold', color: '#002B5B' },
  
  selectedProductBox: { flexDirection: 'row', backgroundColor: '#F0F8FF', padding: 15, borderRadius: 12, marginBottom: 20, borderWidth: 1, borderColor: '#CCE5FF', alignItems: 'center' },
  modalProdImg: { width: 60, height: 60, borderRadius: 8, backgroundColor: '#FFF' },
  modalProdInfo: { marginLeft: 15, justifyContent: 'center', flex: 1 },
  modalProdTitle: { fontSize: 15, fontWeight: 'bold', color: '#002B5B' },
  modalProdPrice: { fontSize: 15, fontWeight: '900', color: '#007BFF', marginTop: 4 },

  inputLabel: { fontSize: 13, fontWeight: 'bold', color: '#333', marginBottom: 8, marginTop: 10 },
  textInput: { borderWidth: 1, borderColor: '#E2E8F0', borderRadius: 10, paddingHorizontal: 15, height: 50, backgroundColor: '#F8F9FA', fontSize: 14, color: '#333' },
  textArea: { borderWidth: 1, borderColor: '#E2E8F0', borderRadius: 10, paddingHorizontal: 15, paddingTop: 15, height: 80, backgroundColor: '#F8F9FA', fontSize: 14, color: '#333' },
  
  submitBtn: { backgroundColor: '#007BFF', borderRadius: 12, height: 55, justifyContent: 'center', alignItems: 'center', marginTop: 25 },
  submitBtnText: { color: '#FFF', fontSize: 16, fontWeight: 'bold' }
});
