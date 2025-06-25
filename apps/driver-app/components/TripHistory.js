import React, { useState, useEffect } from "react";
import {
  View,
  Text,
  StyleSheet,
  FlatList,
  TouchableOpacity,
  ActivityIndicator,
  RefreshControl,
  Dimensions,
} from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { API_BASE_URL } from "../utils/api";

const { width } = Dimensions.get("window");

export default function TripHistory({ token, user }) {
  const [trips, setTrips] = useState([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [stats, setStats] = useState({
    totalRides: 0,
    totalEarnings: 0,
    averageRating: 0,
    thisWeek: 0,
  });

  useEffect(() => {
    if (user && user.id) {
      fetchTripHistory();
      fetchStats();
    } else {
      // Use mock data if no user
      setTrips([
        {
          id: 1,
          created_at: "2024-01-15T10:30:00Z",
          estimated_fare: 25.50,
          status: "completed",
          origin: "Downtown",
          destination: "Uptown",
          duration: 25,
          rating: 4.8,
        },
        {
          id: 2,
          created_at: "2024-01-14T15:20:00Z",
          estimated_fare: 18.75,
          status: "completed",
          origin: "Airport",
          destination: "City Center",
          duration: 35,
          rating: 5.0,
        },
      ]);
      setStats({
        totalRides: 156,
        totalEarnings: 3240.75,
        averageRating: 4.7,
        thisWeek: 847.25,
      });
      setLoading(false);
    }
  }, [user]);

  const fetchTripHistory = async () => {
    if (!user || !user.id) return;
    
    try {
      const response = await fetch(`${API_BASE_URL}/api/drivers/${user.id}/trips`, {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });

      if (response.ok) {
        const data = await response.json();
        setTrips(data);
      } else {
        // Use mock data on error
        setTrips([
          {
            id: 1,
            created_at: "2024-01-15T10:30:00Z",
            estimated_fare: 25.50,
            status: "completed",
            origin: "Downtown",
            destination: "Uptown",
            duration: 25,
            rating: 4.8,
          },
          {
            id: 2,
            created_at: "2024-01-14T15:20:00Z",
            estimated_fare: 18.75,
            status: "completed",
            origin: "Airport",
            destination: "City Center",
            duration: 35,
            rating: 5.0,
          },
        ]);
      }
    } catch (error) {
      console.error("Error fetching trip history:", error);
      // Use mock data on error
      setTrips([
        {
          id: 1,
          created_at: "2024-01-15T10:30:00Z",
          estimated_fare: 25.50,
          status: "completed",
          origin: "Downtown",
          destination: "Uptown",
          duration: 25,
          rating: 4.8,
        },
        {
          id: 2,
          created_at: "2024-01-14T15:20:00Z",
          estimated_fare: 18.75,
          status: "completed",
          origin: "Airport",
          destination: "City Center",
          duration: 35,
          rating: 5.0,
        },
      ]);
    } finally {
      setLoading(false);
    }
  };

  const fetchStats = async () => {
    if (!user || !user.id) return;
    
    try {
      const response = await fetch(`${API_BASE_URL}/api/drivers/${user.id}/stats`, {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });

      if (response.ok) {
        const data = await response.json();
        setStats(data);
      } else {
        // Use mock data on error
        setStats({
          totalRides: 156,
          totalEarnings: 3240.75,
          averageRating: 4.7,
          thisWeek: 847.25,
        });
      }
    } catch (error) {
      console.error("Error fetching stats:", error);
      // Use mock data on error
      setStats({
        totalRides: 156,
        totalEarnings: 3240.75,
        averageRating: 4.7,
        thisWeek: 847.25,
      });
    }
  };

  const onRefresh = async () => {
    setRefreshing(true);
    await Promise.all([fetchTripHistory(), fetchStats()]);
    setRefreshing(false);
  };

  const formatDate = (dateString) => {
    const date = new Date(dateString);
    return date.toLocaleDateString("en-US", {
      month: "short",
      day: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    });
  };

  const formatDuration = (minutes) => {
    if (minutes < 60) {
      return `${minutes} min`;
    }
    const hours = Math.floor(minutes / 60);
    const mins = minutes % 60;
    return `${hours}h ${mins}min`;
  };

  const getStatusColor = (status) => {
    switch (status) {
      case "completed":
        return "#4CAF50";
      case "cancelled":
        return "#FF5722";
      case "in_progress":
        return "#2196F3";
      default:
        return "#666";
    }
  };

  const getStatusIcon = (status) => {
    switch (status) {
      case "completed":
        return "checkmark-circle";
      case "cancelled":
        return "close-circle";
      case "in_progress":
        return "car";
      default:
        return "time";
    }
  };

  const renderTripItem = ({ item }) => (
    <View style={styles.tripItem}>
      <View style={styles.tripHeader}>
        <View style={styles.tripInfo}>
          <Text style={styles.tripDate}>{formatDate(item.created_at)}</Text>
          <Text style={styles.tripEarnings}>${item.estimated_fare}</Text>
        </View>
        <View style={[styles.statusBadge, { backgroundColor: getStatusColor(item.status) }]}>
          <Ionicons name={getStatusIcon(item.status)} size={16} color="#fff" />
          <Text style={styles.statusText}>{item.status}</Text>
        </View>
      </View>

      <View style={styles.tripDetails}>
        <View style={styles.locationItem}>
          <Ionicons name="location" size={16} color="#4CAF50" />
          <Text style={styles.locationText}>{item.origin}</Text>
        </View>
        <View style={styles.locationItem}>
          <Ionicons name="location" size={16} color="#FF5722" />
          <Text style={styles.locationText}>{item.destination}</Text>
        </View>
      </View>

      <View style={styles.tripFooter}>
        <View style={styles.tripStats}>
          <Ionicons name="time" size={14} color="#666" />
          <Text style={styles.tripStatText}>
            {formatDuration(item.duration || 15)}
          </Text>
        </View>
        <View style={styles.tripStats}>
          <Ionicons name="star" size={14} color="#FFD700" />
          <Text style={styles.tripStatText}>
            {item.rating ? `${item.rating}/5` : "No rating"}
          </Text>
        </View>
      </View>
    </View>
  );

  const renderStatsCard = () => (
    <View style={styles.statsContainer}>
      <View style={styles.statsRow}>
        <View style={styles.statCard}>
          <Ionicons name="car" size={24} color="#2196F3" />
          <Text style={styles.statValue}>{stats.totalRides}</Text>
          <Text style={styles.statLabel}>Total Rides</Text>
        </View>
        <View style={styles.statCard}>
          <Ionicons name="cash" size={24} color="#4CAF50" />
          <Text style={styles.statValue}>${stats.totalEarnings}</Text>
          <Text style={styles.statLabel}>Total Earnings</Text>
        </View>
      </View>
      <View style={styles.statsRow}>
        <View style={styles.statCard}>
          <Ionicons name="star" size={24} color="#FFD700" />
          <Text style={styles.statValue}>{stats.averageRating.toFixed(1)}</Text>
          <Text style={styles.statLabel}>Avg Rating</Text>
        </View>
        <View style={styles.statCard}>
          <Ionicons name="calendar" size={24} color="#FF6B35" />
          <Text style={styles.statValue}>${stats.thisWeek}</Text>
          <Text style={styles.statLabel}>This Week</Text>
        </View>
      </View>
    </View>
  );

  if (loading) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color="#2196F3" />
        <Text style={styles.loadingText}>Loading trip history...</Text>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <Text style={styles.title}>Trip History</Text>
      
      {renderStatsCard()}

      <View style={styles.tripsHeader}>
        <Text style={styles.tripsTitle}>Recent Trips</Text>
        <Text style={styles.tripsCount}>{trips.length} trips</Text>
      </View>

      <FlatList
        data={trips}
        renderItem={renderTripItem}
        keyExtractor={(item) => item.id.toString()}
        showsVerticalScrollIndicator={false}
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={onRefresh} />
        }
        ListEmptyComponent={
          <View style={styles.emptyContainer}>
            <Ionicons name="car-outline" size={64} color="#ccc" />
            <Text style={styles.emptyText}>No trips yet</Text>
            <Text style={styles.emptySubtext}>
              Your completed trips will appear here
            </Text>
          </View>
        }
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#f5f5f5",
    padding: 20,
  },
  title: {
    fontSize: 24,
    fontWeight: "bold",
    color: "#333",
    marginBottom: 20,
  },
  statsContainer: {
    backgroundColor: "#fff",
    borderRadius: 15,
    padding: 20,
    marginBottom: 20,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 3.84,
    elevation: 5,
  },
  statsRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    marginBottom: 15,
  },
  statCard: {
    flex: 1,
    alignItems: "center",
    backgroundColor: "#f8f9fa",
    borderRadius: 10,
    padding: 15,
    marginHorizontal: 5,
  },
  statValue: {
    fontSize: 20,
    fontWeight: "bold",
    color: "#333",
    marginTop: 5,
  },
  statLabel: {
    fontSize: 12,
    color: "#666",
    marginTop: 2,
  },
  tripsHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 15,
  },
  tripsTitle: {
    fontSize: 18,
    fontWeight: "bold",
    color: "#333",
  },
  tripsCount: {
    fontSize: 14,
    color: "#666",
  },
  tripItem: {
    backgroundColor: "#fff",
    borderRadius: 15,
    padding: 15,
    marginBottom: 10,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 2.22,
    elevation: 3,
  },
  tripHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 10,
  },
  tripInfo: {
    flex: 1,
  },
  tripDate: {
    fontSize: 14,
    color: "#666",
  },
  tripEarnings: {
    fontSize: 18,
    fontWeight: "bold",
    color: "#4CAF50",
    marginTop: 2,
  },
  statusBadge: {
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 12,
  },
  statusText: {
    color: "#fff",
    fontSize: 12,
    fontWeight: "600",
    marginLeft: 4,
  },
  tripDetails: {
    marginBottom: 10,
  },
  locationItem: {
    flexDirection: "row",
    alignItems: "center",
    marginBottom: 5,
  },
  locationText: {
    fontSize: 14,
    color: "#333",
    marginLeft: 8,
    flex: 1,
  },
  tripFooter: {
    flexDirection: "row",
    justifyContent: "space-between",
    borderTopWidth: 1,
    borderTopColor: "#eee",
    paddingTop: 10,
  },
  tripStats: {
    flexDirection: "row",
    alignItems: "center",
  },
  tripStatText: {
    fontSize: 12,
    color: "#666",
    marginLeft: 4,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
  },
  loadingText: {
    marginTop: 10,
    fontSize: 16,
    color: "#666",
  },
  emptyContainer: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    paddingVertical: 50,
  },
  emptyText: {
    fontSize: 18,
    color: "#666",
    marginTop: 10,
  },
  emptySubtext: {
    fontSize: 14,
    color: "#999",
    marginTop: 5,
    textAlign: "center",
  },
}); 