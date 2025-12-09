'use client'

import React, { useState } from "react"
import { authService } from "@/lib/auth-service"

export default function SignUpPage() {
  const [name, setName] = useState("")
  const [email, setEmail] = useState("")
  const [password, setPassword] = useState("")
  const [confirmPassword, setConfirmPassword] = useState("")
  const [isLoading, setIsLoading] = useState(false)

  const handleSubmit = async (e) => {
    e.preventDefault()

    if (password !== confirmPassword) {
      alert("Passwords do not match ❌")
      return
    }

    setIsLoading(true)

    try {
      // Create account using auth service (Firebase or localStorage)
      await authService.signUp(email, password, name)

      alert("Account created successfully 🎉")
      window.location.href = "/dashboard/user"
    } catch (error) {
      console.error(error)
      alert(error.message || "Failed to create account")
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <div style={styles.container}>
      <div style={styles.card}>
        <h2 style={styles.title}>Citizen Sign Up</h2>
        <p style={styles.subtitle}>Create an account to report civic issues</p>

        <form onSubmit={handleSubmit} style={styles.form}>
          <input
            type="text"
            placeholder="Enter your full name"
            value={name}
            onChange={(e) => setName(e.target.value)}
            style={styles.input}
            required
          />
          <input
            type="email"
            placeholder="Enter your email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            style={styles.input}
            required
          />
          <input
            type="password"
            placeholder="Enter your password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            style={styles.input}
            required
          />
          <input
            type="password"
            placeholder="Confirm your password"
            value={confirmPassword}
            onChange={(e) => setConfirmPassword(e.target.value)}
            style={styles.input}
            required
          />

          <button type="submit" style={styles.button} disabled={isLoading}>
            {isLoading ? "Creating Account..." : "Sign Up"}
          </button>
        </form>

        <p style={styles.footer}>
          Already have an account?{" "}
          <a href="/login/user" style={{ color: "limegreen" }}>
            Sign In
          </a>
        </p>

        <p style={{ marginTop: "15px", color: "white", textAlign: "center" }}>
          Created by <span style={{ color: "limegreen", fontWeight: "bold" }}>PickUpNow</span>
        </p>
      </div>
    </div>
  )
}

const styles = {
  container: {
    backgroundColor: "#000",
    minHeight: "100vh",
    display: "flex",
    justifyContent: "center",
    alignItems: "center",
    color: "#fff",
  },
  card: {
    backgroundColor: "#111",
    padding: "30px",
    borderRadius: "10px",
    textAlign: "center",
    width: "350px",
    boxShadow: "0px 0px 10px rgba(0,255,0,0.3)",
  },
  title: {
    marginBottom: "5px",
  },
  subtitle: {
    marginBottom: "20px",
    fontSize: "14px",
    color: "#ccc",
  },
  form: {
    display: "flex",
    flexDirection: "column",
    gap: "15px",
  },
  input: {
    padding: "10px",
    borderRadius: "5px",
    border: "1px solid #444",
    backgroundColor: "#222",
    color: "#fff",
  },
  button: {
    padding: "10px",
    borderRadius: "5px",
    backgroundColor: "limegreen",
    border: "none",
    color: "#000",
    fontWeight: "bold",
    cursor: "pointer",
  },
  footer: {
    marginTop: "15px",
    fontSize: "13px",
    color: "#bbb",
  },
}
