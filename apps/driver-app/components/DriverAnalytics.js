import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  ScrollView,
  ActivityIndicator,
  Dimensions,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';

const { width } = Dimensions.get('window');

export default function DriverAnalytics({ user }) {
  const [loading, setLoading] = useState(false);
  const [selectedPeriod, setSelectedPeriod] = useState('week');
  const [analytics, setAnalytics] = useState({
    earnings: {
      total: 1250,
      average: 89,
      trend: '+12%',
      breakdown: {
        rides: 850,
        tips: 250,
        bonuses: 150,
      }
    },
    rides: {
      total: 45,
      completed: 42,
      cancelled: 3,
      averageRating: 4.8,
      completionRate: 93,
    },
    performance: {
      hoursOnline: 28,
      milesDriven: 320,
      fuelEfficiency: 28.5,
      customerSatisfaction: 4.8,
    },
    insights: [
      {
        type: 'positive',
        title: 'Top Performer',
        description: 'You\'re in the top 10% of drivers this week!',
        icon: 'trophy',
      },
      {
        type: 'info',
        title: 'Peak Hours',
        description: 'Your best earnings are between 5-9 PM',
        icon: 'time',
      },
      {
        type: 'warning',
        title: 'Improvement Area',
        description: 'Consider working more weekend hours for higher earnings',
        icon: 'trending-up',
      },
    ]
  });

  const periods = [
    { key: 'day', label: 'Today' },
    { key: 'week', label: 'This Week' },
    { key: 'month', label: 'This Month' },
    { key: 'year', label: 'This Year' },
  ];

  const getMetricColor = (value, type = 'positive') => {
    if (type === 'positive') return '#4CAF50';
    if (type === 'negative') return '#f44336';
    if (type === 'neutral') return '#FF9800';
    return '#2196F3';
  };

  const MetricCard = ({ title, value, subtitle, icon, color = '#2196F3', trend }) => (
    <View style={styles.metricCard}>
      <View style={styles.metricHeader}>
        <Ionicons name={icon} size={24} color={color} />
        <Text style={styles.metricTitle}>{title}</Text>
      </View>
      <Text style={[styles.metricValue, { color }]}>{value}</Text>
      {subtitle && <Text style={styles.metricSubtitle}>{subtitle}</Text>}
      {trend && (
        <View style={styles.trendContainer}>
          <Ionicons 
            name={trend.startsWith('+') ? 'trending-up' : 'trending-down'} 
            size={16} 
            color={getMetricColor(trend)} 
          />
          <Text style={[styles.trendText, { color: getMetricColor(trend) }]}>
            {trend}
          </Text>
        </View>
      )}
    </View>
  );

  const InsightCard = ({ insight }) => (
    <View style={[styles.insightCard, styles[`insight${insight.type}`]]}>
      <Ionicons 
        name={insight.icon} 
        size={24} 
        color={getMetricColor('', insight.type)} 
      />
      <View style={styles.insightContent}>
        <Text style={styles.insightTitle}>{insight.title}</Text>
        <Text style={styles.insightDescription}>{insight.description}</Text>
      </View>
    </View>
  );

  return (
    <ScrollView style={styles.container}>
      {/* Period Selector */}
      <View style={styles.periodSelector}>
        {periods.map((period) => (
          <TouchableOpacity
            key={period.key}
            style={[
              styles.periodButton,
              selectedPeriod === period.key && styles.periodButtonActive
            ]}
            onPress={() => setSelectedPeriod(period.key)}
          >
            <Text style={[
              styles.periodButtonText,
              selectedPeriod === period.key && styles.periodButtonTextActive
            ]}>
              {period.label}
            </Text>
          </TouchableOpacity>
        ))}
      </View>

      {/* Earnings Overview */}
      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Earnings Overview</Text>
        <View style={styles.metricsGrid}>
          <MetricCard
            title="Total Earnings"
            value={`$${analytics.earnings.total}`}
            subtitle="This period"
            icon="cash"
            color="#4CAF50"
            trend={analytics.earnings.trend}
          />
          <MetricCard
            title="Average per Ride"
            value={`$${analytics.earnings.average}`}
            subtitle="Per trip"
            icon="car"
            color="#2196F3"
          />
        </View>
        
        {/* Earnings Breakdown */}
        <View style={styles.breakdownContainer}>
          <Text style={styles.breakdownTitle}>Earnings Breakdown</Text>
          <View style={styles.breakdownItem}>
            <Text style={styles.breakdownLabel}>Ride Fares</Text>
            <Text style={styles.breakdownValue}>${analytics.earnings.breakdown.rides}</Text>
          </View>
          <View style={styles.breakdownItem}>
            <Text style={styles.breakdownLabel}>Tips</Text>
            <Text style={styles.breakdownValue}>${analytics.earnings.breakdown.tips}</Text>
          </View>
          <View style={styles.breakdownItem}>
            <Text style={styles.breakdownLabel}>Bonuses</Text>
            <Text style={styles.breakdownValue}>${analytics.earnings.breakdown.bonuses}</Text>
          </View>
        </View>
      </View>

      {/* Ride Performance */}
      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Ride Performance</Text>
        <View style={styles.metricsGrid}>
          <MetricCard
            title="Total Rides"
            value={analytics.rides.total}
            subtitle="Completed"
            icon="car-sport"
            color="#2196F3"
          />
          <MetricCard
            title="Completion Rate"
            value={`${analytics.rides.completionRate}%`}
            subtitle="Success rate"
            icon="checkmark-circle"
            color="#4CAF50"
          />
          <MetricCard
            title="Average Rating"
            value={analytics.rides.averageRating}
            subtitle="Customer rating"
            icon="star"
            color="#FF9800"
          />
          <MetricCard
            title="Cancelled"
            value={analytics.rides.cancelled}
            subtitle="Rides cancelled"
            icon="close-circle"
            color="#f44336"
          />
        </View>
      </View>

      {/* Performance Metrics */}
      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Performance Metrics</Text>
        <View style={styles.metricsGrid}>
          <MetricCard
            title="Hours Online"
            value={`${analytics.performance.hoursOnline}h`}
            subtitle="Active time"
            icon="time"
            color="#2196F3"
          />
          <MetricCard
            title="Miles Driven"
            value={`${analytics.performance.milesDriven}mi`}
            subtitle="Total distance"
            icon="map"
            color="#4CAF50"
          />
          <MetricCard
            title="Fuel Efficiency"
            value={`${analytics.performance.fuelEfficiency}mpg`}
            subtitle="Average"
            icon="speedometer"
            color="#FF9800"
          />
          <MetricCard
            title="Customer Satisfaction"
            value={analytics.performance.customerSatisfaction}
            subtitle="Average rating"
            icon="happy"
            color="#4CAF50"
          />
        </View>
      </View>

      {/* Performance Insights */}
      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Performance Insights</Text>
        {analytics.insights.map((insight, index) => (
          <InsightCard key={index} insight={insight} />
        ))}
      </View>

      {/* Recommendations */}
      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Recommendations</Text>
        <View style={styles.recommendationCard}>
          <Ionicons name="bulb" size={24} color="#FF9800" />
          <View style={styles.recommendationContent}>
            <Text style={styles.recommendationTitle}>Optimize Your Schedule</Text>
            <Text style={styles.recommendationText}>
              Based on your performance data, working during peak hours (5-9 PM) 
              could increase your earnings by 25%.
            </Text>
          </View>
        </View>
        
        <View style={styles.recommendationCard}>
          <Ionicons name="trending-up" size={24} color="#4CAF50" />
          <View style={styles.recommendationContent}>
            <Text style={styles.recommendationTitle}>Maintain High Ratings</Text>
            <Text style={styles.recommendationText}>
              Your excellent rating of 4.8 helps you get priority for premium rides. 
              Keep up the great service!
            </Text>
          </View>
        </View>
      </View>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f5f5f5',
    padding: 20,
  },
  periodSelector: {
    flexDirection: 'row',
    backgroundColor: '#fff',
    borderRadius: 10,
    padding: 5,
    marginBottom: 20,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 3.84,
    elevation: 5,
  },
  periodButton: {
    flex: 1,
    paddingVertical: 10,
    paddingHorizontal: 15,
    borderRadius: 8,
    alignItems: 'center',
  },
  periodButtonActive: {
    backgroundColor: '#2196F3',
  },
  periodButtonText: {
    fontSize: 14,
    fontWeight: '600',
    color: '#666',
  },
  periodButtonTextActive: {
    color: '#fff',
  },
  section: {
    backgroundColor: '#fff',
    borderRadius: 15,
    padding: 20,
    marginBottom: 20,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 3.84,
    elevation: 5,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    marginBottom: 15,
    color: '#333',
  },
  metricsGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'space-between',
  },
  metricCard: {
    width: (width - 60) / 2,
    backgroundColor: '#f8f9fa',
    borderRadius: 10,
    padding: 15,
    marginBottom: 15,
    alignItems: 'center',
  },
  metricHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 10,
  },
  metricTitle: {
    fontSize: 14,
    fontWeight: '600',
    color: '#666',
    marginLeft: 8,
  },
  metricValue: {
    fontSize: 24,
    fontWeight: 'bold',
    marginBottom: 5,
  },
  metricSubtitle: {
    fontSize: 12,
    color: '#999',
    textAlign: 'center',
  },
  trendContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: 5,
  },
  trendText: {
    fontSize: 12,
    fontWeight: '600',
    marginLeft: 4,
  },
  breakdownContainer: {
    marginTop: 15,
    paddingTop: 15,
    borderTopWidth: 1,
    borderTopColor: '#eee',
  },
  breakdownTitle: {
    fontSize: 16,
    fontWeight: '600',
    marginBottom: 10,
    color: '#333',
  },
  breakdownItem: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingVertical: 8,
  },
  breakdownLabel: {
    fontSize: 14,
    color: '#666',
  },
  breakdownValue: {
    fontSize: 14,
    fontWeight: '600',
    color: '#333',
  },
  insightCard: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 15,
    borderRadius: 10,
    marginBottom: 10,
  },
  insightpositive: {
    backgroundColor: '#e8f5e8',
  },
  insightinfo: {
    backgroundColor: '#e3f2fd',
  },
  insightwarning: {
    backgroundColor: '#fff3e0',
  },
  insightContent: {
    flex: 1,
    marginLeft: 15,
  },
  insightTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#333',
    marginBottom: 5,
  },
  insightDescription: {
    fontSize: 14,
    color: '#666',
  },
  recommendationCard: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    padding: 15,
    backgroundColor: '#f8f9fa',
    borderRadius: 10,
    marginBottom: 15,
  },
  recommendationContent: {
    flex: 1,
    marginLeft: 15,
  },
  recommendationTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#333',
    marginBottom: 5,
  },
  recommendationText: {
    fontSize: 14,
    color: '#666',
    lineHeight: 20,
  },
}); 