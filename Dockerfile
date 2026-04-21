FROM debian:stable-slim

RUN apt-get update && apt-get install -y g++

WORKDIR /app
COPY . .

RUN g++ -o server main.cpp

EXPOSE 8080
CMD ["./server"]
