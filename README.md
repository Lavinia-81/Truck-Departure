# Truck Departure Management System

## 1. Overview

This platform is a modern, interactive solution for real-time management of truck departures from a logistics warehouse. The project was designed to digitize and centralize the shipping schedule, replacing error-prone manual processes with an efficient and intuitive interface.

The main objective is to reduce administrative tasks, minimize human error, and provide a single source of truth for logistics staff, drivers, and managers, thereby improving the operational workflow.

## 2. Components and Functionalities

The application is structured into several key components, each with a specific role in the logistics ecosystem.

### A. Admin Dashboard (Main Page `/`)
This is the command center where logistics personnel perform daily operations.

*   **Centralized Departures Management:**
    *   **Add (`Add Departure`):** Allows for the quick addition of a new departure with all necessary details (carrier, destination, trailer, time, etc.).
    *   **Edit:** Allows for the modification of any detail of an existing departure.
    *   **Delete:** Removes a departure from the system, with a confirmation dialog to prevent accidental deletions.

*   **AI-Powered Route Analysis:**
    *   **`Check Road Status`:** By clicking the brain icon for any departure, the system uses a Generative AI agent to provide a real-time analysis of the route from the depot to the destination. This analysis includes:
        *   The optimized route.
        *   Estimated travel time.
        *   A summary of any significant warnings, accidents, road closures, or severe weather.
        *   A severity level classification ('none', 'moderate', 'severe') for any issues found.

*   **Bulk Operations (Import / Export):**
    *   **`Import`:** Uploads a complete departure schedule from an **Excel file**, automatically populating the table and saving valuable time.
    *   **`Export`:** Downloads the current view of departures into an Excel file for archiving, reporting, or offline analysis.

*   **Navigation and Utilities:**
    *   **`Public Display`:** Opens the public display panel (`/display`) in a new tab to check the view intended for drivers.
    *   **`Clear All`:** A reset function that allows for the complete deletion of all data from the database (with confirmation).

### B. User Management (`/admin/users`)
A dedicated page for managing who has administrative access to the platform.

*   **Add Administrator:** Grant admin privileges to a new user by entering their email address.
*   **View Administrators:** A clear list of all current users with administrative rights.
*   **Remove Administrator:** Revoke admin access from a user. Self-removal is prevented to avoid lockouts.

### C. Public Display Panel (`/display`)
Designed as a "Kiosk" mode for large monitors located in driver waiting areas or the warehouse.

*   **Maximum Visibility:** Displays a clear, chronologically sorted list with essential information: carrier, destination, time, bay, and status.
*   **Real-Time Updates:** The screen automatically refreshes with any changes made in the admin panel, ensuring perfect data synchronization. It includes an auto-scroll feature for long lists.
*   **Visual Coding:** The status of each departure is marked with a distinct color, according to the legend in the footer, allowing for quick identification of the current state.

## 3. Architecture and Technologies

The project utilizes a modern technology stack focused on performance, scalability, and a top-tier user experience.

*   **Framework:** **Next.js** (React) - For a fast web interface with Server-Side Rendering (SSR), Server Actions, and modern features.
*   **Data Storage:** **Firebase Firestore** - A scalable and real-time NoSQL database for persisting all departure and user data.
*   **Authentication:** **Firebase Authentication** - For secure sign-in using Google accounts.
*   **Generative AI:** **Google AI (Gemini)** via **Genkit** - Powers the real-time route and traffic analysis feature.
*   **UI & Styling:**
    *   **Tailwind CSS:** A utility-first CSS framework for rapid and consistent styling.
    *   **shadcn/ui:** A collection of reusable React components, built on top of Tailwind CSS, for a professional and accessible design.

## 4. Installation and Startup Guide

To run the project in your local environment, follow the steps below.

### Prerequisites
*   **Node.js** (version 18 or later)
*   **npm** or **yarn**

### Installation Steps

1.  **Clone the Repository (if applicable) and Navigate into the Directory:**
    ```bash
    git clone <repository_url>
    cd <project_directory>
    ```

2.  **Install Dependencies:**
    Run the command below to install all necessary packages.
    ```bash
    npm install
    ```
    
3.  **Start the Development Server:**
    Run the command below to start the application.
    ```bash
    npm run dev
    ```

4.  **Access the Application:**
    Open your browser and navigate to `http://localhost:9002` to view the Admin Dashboard.
