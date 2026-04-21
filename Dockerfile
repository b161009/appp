# Chọn image base có sẵn compiler
FROM debian:stable-slim

# Cài đặt công cụ build
RUN apt-get update && apt-get install -y \
    g++ \
    cmake \
    make \
    && rm -rf /var/lib/apt/lists/*

# Tạo thư mục làm việc
WORKDIR /app

# Copy toàn bộ code vào container
COPY . .

# Build project với CMake
RUN mkdir build && cd build && cmake .. && make

# Expose port (Railway sẽ map port này)
EXPOSE 8080

# Chạy binary sau khi build
CMD ["./build/server"]
