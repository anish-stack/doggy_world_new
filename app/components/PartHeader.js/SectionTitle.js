import React from 'react';
import { View, Text, StyleSheet } from 'react-native';

const variants = {
  primary: {
    container: {
      // marginBottom: 24,
      borderLeftWidth: 4,
      borderLeftColor: '#D22B2B',
      paddingLeft: 16,
    },
    title: {
      color: '#1f2937',
      fontSize: 28,
      fontWeight: '700',
    },
    subtitle: {
      color: '#4b5563',
      fontSize: 16,
      marginTop: 8,
    }
  },
  secondary: {
    container: {
      marginBottom: 24,
      backgroundColor: '#f8fafc',
      padding: 16,
      borderRadius: 12,
    },
    title: {
      color: '#334155',
      fontSize: 26,
      fontWeight: '600',
    },
    subtitle: {
      color: '#64748b',
      fontSize: 15,
      marginTop: 6,
    }
  },
  accent: {
    container: {
      marginBottom: 24,
      backgroundColor: '#3b82f6',
      padding: 16,
      borderRadius: 8,
    },
    title: {
      color: '#ffffff',
      fontSize: 24,
      fontWeight: '700',
    },
    subtitle: {
      color: '#e0e7ff',
      fontSize: 14,
      marginTop: 4,
    }
  },
  minimal: {
    container: {
      marginBottom: 20,
    },
    title: {
      color: '#111827',
      fontSize: 22,
      fontWeight: '500',
    },
    subtitle: {
      color: '#6b7280',
      fontSize: 14,
      marginTop: 4,
    }
  }
};

export default function SectionTitle({
  title,
  subtitle,
  variant = 'primary',
  style
}) {
  const variantStyles = variants[variant];

  return (
    <View style={[variantStyles.container, style]}>
      <Text style={variantStyles.title}>
        {title}
      </Text>
      {subtitle && (
        <Text style={variantStyles.subtitle}>
          {subtitle}
        </Text>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  // Base styles if needed
  container: {
    marginBottom: 16,
  },
  title: {
    fontSize: 24,
    fontWeight: 'bold',
  },
  subtitle: {
    fontSize: 16,
    marginTop: 4,
  }
});