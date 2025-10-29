package main

import (
	"encoding/json"
	"fmt"
	"log"
	"net/http"
	"net/smtp"
	"os"
)

// Email struct to hold form data
type Email struct {
	To      string `json:"to"`
	Subject string `json:"subject"`
	Body    string `json:"body"`
}

func sendEmail(to, subject, body string) error {
	// Set up authentication information.
	auth := smtp.PlainAuth(
		"",
		os.Getenv("EMAIL_ADDRESS"),  // Use environment variable
		os.Getenv("EMAIL_PASSWORD"), // Use environment variable
		"smtp.gmail.com",
	)

	// Compose the email message
	msg := []byte("To: " + to + "\r\n" +
		"Subject: " + subject + "\r\n" +
		"\r\n" + body + "\r\n")

	// Send the email
	err := smtp.SendMail(
		"smtp.gmail.com:587",
		auth,
		os.Getenv("EMAIL_ADDRESS"), // Use environment variable
		[]string{to},
		msg,
	)
	return err
}

func main() {
	http.HandleFunc("/send-email", func(w http.ResponseWriter, r *http.Request) {
		if r.Method != http.MethodPost {
			http.Error(w, "Invalid request method", http.StatusMethodNotAllowed)
			return
		}

		var email Email
		// Decode the JSON payload
		if err := json.NewDecoder(r.Body).Decode(&email); err != nil {
			http.Error(w, "Invalid request payload", http.StatusBadRequest)
			return
		}

		// Send the email
		err := sendEmail(email.To, email.Subject, email.Body)
		if err != nil {
			log.Printf("smtp error: %s", err)
			http.Error(w, "Failed to send email", http.StatusInternalServerError)
			return
		}

		fmt.Fprintf(w, "Email sent successfully!")
	})
	//error handling

	// Add a test route

	// Add a test route

	// Add a test route

	http.HandleFunc("/test", func(w http.ResponseWriter, r *http.Request) {
		if r.Method != http.MethodGet {
			http.Error(w, "Invalid request method", http.StatusMethodNotAllowed)
			return
		}
		fmt.Fprintf(w, "Hello, World!")
	})

	// Add CORS headers
	http.Handle("/", http.HandlerFunc(func(w http.ResponseWriter, r *http.Request) {
		w.Header().Set("Access-Control-Allow-Origin", "*")
		w.Header().Set("Access-Control-Allow-Headers", "Content-Type")
		http.DefaultServeMux.ServeHTTP(w, r)
	}))

	// Start the server
	log.Println("Server started at :8080")
	log.Fatal(http.ListenAndServe(":8080", nil))
}
