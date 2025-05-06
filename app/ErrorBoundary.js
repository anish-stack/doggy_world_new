import React, { Component } from "react";
import { View, Text, Button, Image, ScrollView } from "react-native";

class ErrorBoundary extends Component {
  constructor(props) {
    super(props);
    this.state = { hasError: false, error: null, errorInfo: null };
  }

  static getDerivedStateFromError(error) {
    return { hasError: true, error };
  }

  componentDidCatch(error, errorInfo) {
    this.setState({ errorInfo });

    // Redirect to login if the error contains a 401 Unauthorized message
    if (error?.response?.status === 401) {
      this.props.navigation.navigate("Login");
      return;
    }
  }

  handleRetry = () => {
    this.setState({ hasError: false, error: null, errorInfo: null });
  };

  render() {
    if (this.state.hasError) {
      return (
        <ScrollView contentContainerStyle={styles.container}>
          <Image
            source={{ uri: "https://img.freepik.com/free-vector/oops-404-error-with-broken-robot-concept-illustration_114360-5529.jpg" }}
            style={styles.image}
            resizeMode="contain"
          />
          <Text style={styles.title}>Oops! Something went wrong.</Text>
          <Text style={styles.message}>
            {this.state.error ? this.state.error.toString() : "An unexpected error occurred."}
          </Text>
          {this.state.errorInfo && (
            <Text style={styles.details}>
              Component: {this.state.errorInfo.componentStack}
            </Text>
          )}
          <Text style={styles.tip}>Try refreshing the page or checking the component's implementation.</Text>
          <Button title="Retry" onPress={this.handleRetry} color="#d64444" />
        </ScrollView>
      );
    }

    return this.props.children;
  }
}

const styles = {
  container: {
    flexGrow: 1,
    justifyContent: "center",
    alignItems: "center",
    padding: 20,
  },
  image: {
    width: 300,
    height: 200,
    marginBottom: 20,
  },
  title: {
    fontSize: 20,
    fontWeight: "bold",
    color: "red",
    textAlign: "center",
  },
  message: {
    fontSize: 16,
    marginVertical: 10,
    textAlign: "center",
  },
  details: {
    fontSize: 14,
    color: "gray",
    marginBottom: 10,
    textAlign: "center",
  },
  tip: {
    fontSize: 14,
    fontStyle: "italic",
    textAlign: "center",
  },
};

export default function ErrorBoundaryWrapper(props) {
  return <ErrorBoundary {...props} />;
}
