                     +----------------------+
                     |   Admin Dashboard    |
                     |  (React/Next.js)     |
                     +----------------------+
                               |
                     (API/Admin Auth)
                               |
                     +----------------------+
                     |   Backend API Server |
                     |  (Node.js + Express) |
                     +----------------------+
                          /        |         \
        (WebSockets)     /         |          \  (REST APIs)
                        /          |           \
               +-----------+  +----------+  +----------------+
               | Rider App |  | Driver   |  |  Database (SQL) |
               | (ReactNav)|  | App      |  |  PostgreSQL     |
               +-----------+  +----------+  +----------------+
                    |                |
                    +----------------+
                    | Maps, Stripe,  |
                    | Firebase/Auth0 |
                    +----------------+
