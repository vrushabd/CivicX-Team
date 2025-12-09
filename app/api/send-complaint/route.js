import { NextResponse } from "next/server"
import nodemailer from "nodemailer"

export async function POST(req) {
    try {
        const { complaint, userEmail } = await req.json()

        // Check if environment variables are set
        if (!process.env.EMAIL_USER || !process.env.EMAIL_PASS) {
            console.log("Email credentials not found. Logging complaint instead:")
            console.log(`From: ${userEmail}`)
            console.log(`Complaint: ${complaint}`)
            return NextResponse.json(
                { message: "Complaint logged (Email service not configured)" },
                { status: 200 }
            )
        }

        const transporter = nodemailer.createTransport({
            service: "gmail", // Or use a custom SMTP host
            auth: {
                user: process.env.EMAIL_USER,
                pass: process.env.EMAIL_PASS,
            },
        })

        const mailOptions = {
            from: process.env.EMAIL_USER,
            to: "r4194582@gmail.com",
            replyTo: userEmail,
            subject: `New Complaint from ${userEmail}`,
            text: `
        New complaint received from the Citizen Dashboard:
        
        User: ${userEmail}
        
        Complaint:
        ${complaint}
      `,
        }

        await transporter.sendMail(mailOptions)

        return NextResponse.json({ message: "Complaint sent successfully" }, { status: 200 })
    } catch (error) {
        console.error("Error sending email:", error)
        return NextResponse.json({ error: "Failed to send complaint" }, { status: 500 })
    }
}
