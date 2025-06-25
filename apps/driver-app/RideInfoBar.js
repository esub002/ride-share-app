import React from "react";
import { View, Text, StyleSheet } from "react-native";

export default function RideInfoBar({ from, to }) {
  return (
    <View style={styles.container}>
      <View style={styles.dot} />
      <View>
        <Text style={styles.label}>From</Text>
        <Text style={styles.value}>{from}</Text>
      </View>
      <View style={styles.line} />
      <View style={styles.dotDest} />
      <View>
        <Text style={styles.label}>To</Text>
        <Text style={styles.value}>{to}</Text>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#fff",
    borderRadius: 30,
    paddingVertical: 8,
    paddingHorizontal: 18,
    elevation: 4,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.15,
    shadowRadius: 3,
  },
  dot: {
    width: 12,
    height: 12,
    borderRadius: 6,
    backgroundColor: "#007aff",
    marginRight: 10,
    marginLeft: 2,
  },
  dotDest: {
    width: 12,
    height: 12,
    borderRadius: 6,
    backgroundColor: "#fe7d43",
    marginHorizontal: 10,
  },
  label: {
    fontWeight: "bold",
    fontSize: 13,
    color: "#888",
  },
  value: {
    fontSize: 16,
    fontWeight: "500",
    color: "#222",
    minWidth: 50,
    marginBottom: 2,
  },
  line: {
    width: 24,
    height: 3,
    backgroundColor: "#d3d3d3",
    borderRadius: 2,
    marginHorizontal: 2,
  },
});
