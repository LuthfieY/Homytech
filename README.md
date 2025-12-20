# HomyTech IoT Smart Home System

A comprehensive IoT smart home solution featuring real-time device control, monitoring, and automation. Use this system to manage lights, doors, and automated clotheslines through a modern web interface.

## 🚀 Tech Stack

- **Frontend**: [Next.js](https://nextjs.org/) (React, TypeScript), TailwindCSS, Shadcn UI
- **Backend**: [FastAPI](https://fastapi.tiangolo.com/) (Python)
- **Database**: [MongoDB](https://www.mongodb.com/)
- **Messaging**: [Eclipse Mosquitto](https://mosquitto.org/) (MQTT Broker)
- **Infrastructure**: Docker, Docker Compose, Nginx (Reverse Proxy)

## 📋 Prerequisites

- [Docker](https://www.docker.com/products/docker-desktop)
- [Docker Compose](https://docs.docker.com/compose/install/)

## 🛠️ Installation & Setup

1.  **Clone the repository**
    ```bash
    git clone <repository_url>
    cd <repository_folder>
    ```

2.  **Environment Configuration**
    Ensure you have a `.env` file in the root directory. A default configuration is provided:
    ```env
    # MQTT Configuration
    MQTT_HOST=homytech-mosquitto
    MQTT_PORT=1883
    MQTT_USERNAME=your_mqtt_username
    MQTT_PASSWORD=your_mqtt_password

    # MongoDB Configuration
    MONGODB_URI=mongodb://user:password@mongodb:27017/homytech?authSource=admin
    MONGO_INITDB_ROOT_USERNAME=root_username
    MONGO_INITDB_ROOT_PASSWORD=root_password
    MONGO_INITDB_DATABASE=homytech

    # JWT Configuration
    JWT_SECRET_KEY=your_secret_key
    JWT_ALGORITHM=HS256
    ```

3.  **Run the Application**
    Start the entire stack using Docker Compose:
    ```bash
    docker-compose up -d --build
    ```

## 🌐 Access Points

| Service | URL | Description |
|Args|---|---|
| **Web Interface** | [http://localhost](http://localhost) | Main dashboard for controlling devices |
| **Backend API** | [http://localhost/api/](http://localhost/api/) | Rest API endpoints |
| **API Docs** | [http://localhost/api/docs](http://localhost/api/docs) | Swagger UI for API documentation |

## 🔌 Database Connection
You can connect to the MongoDB instance using MongoDB Compass:

- **Connection String**: `mongodb://localhost:27017/?authSource=admin`
- **Username**: defined in `.env`
- **Password**: defined in `.env`

## 📡 MQTT Integration
The system uses an embedded Mosquitto broker. Devices should connect to:
- **Host**: `localhost` (or server IP)
- **Port**: `1883`
- **Credentials**: See `.env` file

## 📁 Project Structure

```
├── backend/        # FastAPI Application
├── frontend/       # Next.js Application
├── mosquitto/      # MQTT Broker Config
├── mongodb/        # Database Data & Config
├── nginx/          # Reverse Proxy Config
├── docker-compose.yml
└── .env
```
