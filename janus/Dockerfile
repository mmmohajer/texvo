FROM debian:bullseye

# Install dependencies
RUN apt-get update && apt-get install -y \
    build-essential \
    git \
    automake \
    autoconf \
    libtool \
    pkg-config \
    cmake \
    wget \
    unzip \
    # Janus dependencies
    libmicrohttpd-dev \
    libjansson-dev \
    libssl-dev \
    libsrtp2-dev \
    libsofia-sip-ua-dev \
    libglib2.0-dev \
    libopus-dev \
    libogg-dev \
    libini-config-dev \
    libcollection-dev \
    libwebsockets-dev \
    libcurl4-openssl-dev \
    libnanomsg-dev \
    libconfig-dev \
    libnice-dev \
    && rm -rf /var/lib/apt/lists/*

WORKDIR /opt

# ------------------------------------------------
# Build libusrsctp (for data channels support)
# ------------------------------------------------
RUN git clone https://github.com/sctplab/usrsctp.git && \
    cd usrsctp && \
    ./bootstrap && \
    ./configure && \
    make -j$(nproc) && \
    make install

# Ensure libusrsctp is in runtime path
RUN echo "/usr/local/lib" > /etc/ld.so.conf.d/usrsctp.conf && ldconfig

# ------------------------------------------------
# Build Janus Gateway
# ------------------------------------------------
RUN git clone https://github.com/meetecho/janus-gateway.git
WORKDIR /opt/janus-gateway

RUN sh autogen.sh && \
    ./configure --prefix=/usr/local \
                --enable-websockets \
                --disable-docs \
                --enable-data-channels && \
    make -j$(nproc) && \
    make install && \
    make configs

# Expose Janus ports
EXPOSE 8188 8088 10000-10200/udp

# Start Janus
CMD ["janus", "-F", "/usr/local/etc/janus"]
