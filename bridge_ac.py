import socket, struct, asyncio, json
from fastapi import FastAPI, WebSocket
from fastapi.middleware.cors import CORSMiddleware

app = FastAPI()
app.add_middleware(CORSMiddleware, allow_origins=["*"])

# --- CONFIGURAÇÕES ---
AC_IP, AC_PORT = "127.0.0.1", 9996
WS_PORT = 8112  # <--- ADICIONEI DE VOLTA PRA NÃO DAR ERRO

sock = socket.socket(socket.AF_INET, socket.SOCK_DGRAM)
sock.setblocking(False)

@app.websocket("/telemetry")
async def websocket_endpoint(websocket: WebSocket):
    await websocket.accept()
    print(f"🚀 Niobio Labs: Conectado na porta {WS_PORT}")
    
    async def pulse():
        # Handshake para manter o jogo enviando dados
        handshake = struct.pack('<iii', 1, 1, 0)
        subscribe = struct.pack('<iii', 1, 1, 1)
        while True:
            try:
                sock.sendto(handshake, (AC_IP, AC_PORT))
                sock.sendto(subscribe, (AC_IP, AC_PORT))
            except: pass
            await asyncio.sleep(1)

    asyncio.create_task(pulse())

    try:
        while True:
            try:
                data, _ = sock.recvfrom(2048)
                
                # Só processa se o pacote tiver tamanho suficiente
                if len(data) >= 80:
                    # --- LEITURA GARANTIDA (SÓ O QUE FUNCIONA) ---
                    # Velocidade (Offset 12)
                    speed = struct.unpack_from('<f', data, 12)[0]
                    
                    # RPM (Offset 68) - ESSE FUNCIONOU NO SEU PRINT!
                    rpm = struct.unpack_from('<f', data, 68)[0]
                    
                    # Max RPM (Offset 72) - Para a barra de porcentagem
                    max_rpm = struct.unpack_from('<f', data, 72)[0]
                    
                    # Pedal do Acelerador (Offset 56)
                    gas = struct.unpack_from('<f', data, 56)[0]

                    # Cálculo simples de porcentagem
                    rpm_percent = (rpm / max_rpm) * 100 if max_rpm > 0 else 0

                    payload = {
                        "speed": int(speed),
                        "rpm": int(rpm),
                        "rpmPercent": int(rpm_percent),
                        "gas": round(gas, 2),
                        "gear": "N", # Fixo pra não bugar o React por enquanto
                        "status": "ACTIVE"
                    }
                    
                    await websocket.send_text(json.dumps(payload))
            
            except BlockingIOError:
                await asyncio.sleep(0.001)
    except Exception as e:
        print(f"Erro: {e}")

if __name__ == "__main__":
    import uvicorn
    print(f"📡 Niobio Labs ativa na porta {WS_PORT}")
    uvicorn.run(app, host="0.0.0.0", port=WS_PORT)