import socket
import sys
import binascii
from time import sleep
import sys
from datetime import datetime

TCP_IP='192.168.0.123'
TCP_PORT='18083'

# Create a TCP/IP socket
sock = socket.create_connection((TCP_IP, TCP_PORT))

#imei structure
#imei='\x00\x0f356307045518205'

# function to connect an email to the collector and send data
def client (imei):
	imei_message=str(imei).encode()

	print ('sending the imei'+str( imei_message))
	sock.send(imei_message)
	response=sock.recv(4096)

	r=int(binascii.hexlify(response),16)

	print ("Server response "+str(r))
	i=0
	startTime=datetime.now()
	while(i<1000000):
		data_message='\x00\x00\x00\x00\x00\x00\x00\xC0\x08\x04\x00\x00\x01\x13\xFC\x20\x8D\xFF\x00\x0F\x14\xF6\x50\x20\x9C\xCA\x80\x00\x6F\x00\xD6\x04\x00\x04\x00\x04\x03\x01\x01\x15\x03\x16\x03\x00\x01\x46\x00\x00\x01\x5D\x00\x00\x00\x01\x13\xFC\x17\x61\x0B\x00\x0F\x14\xFF\xE0\x20\x9C\xC5\x80\x00\x6E\x00\xC7\x05\x00\x01\x00\x04\x03\x01\x01\x15\x03\x16\x01\x00\x01\x46\x00\x00\x01\x5C\x00\x00\x00\x01\x13\xFC\x28\x49\x45\x00\x0F\x15\x0F\x00\x20\x9C\xD2\x00\x00\x95\x01\x08\x04\x00\x00\x00\x04\x03\x01\x01\x15\x00\x16\x03\x00\x01\x46\x00\x00\x01\x5D\x00\x00\x00\x01\x13\xFC\x26\x7C\x5B\x00\x0F\x15\x0A\x50\x20\x9C\xCC\xC0\x00\x93\x00\x68\x04\x00\x00\x00\x04\x03\x01\x01\x15\x00\x16\x03\x00\x01\x46\x00\x00\x01\x5B\x00\x04\x00\x00\x00\x86\x12'
		sock.send(data_message)
		#response=sock.recv(4096)
		i += 1
		if(i%50000==0):
			print ("Record copy number "+ str(i))
		sock.recv(10)
		sleep(0.5)
	
	print("\n nothing to do")
	sock.close()
 	return datetime.now()-startTime


def toHex(s):
    lst = []
    for ch in s:
        hv = hex(ord(ch)).replace('0x', '')
        if len(hv) == 1:
            hv = '0'+hv
        lst.append(hv)

    return reduce(lambda x,y:x+y, lst)

#20 imei list 

clients=['\x00\x0f356307045518205',
         '\x00\x0f356307045517900',
         '\x00\x0f356307045907002',
         '\x00\x0f356307045596110',
         '\x00\x0f356307040816000',
         '\x00\x0f356307045501953',
         '\x00\x0f356307045568200',
         '\x00\x0f356307045608774',
         '\x00\x0f356307045443271',
         '\x00\x0f356307045412110',
         '\x00\x0f356307045601886',
         '\x00\x0f356307045518064',
         '\x00\x0f356307045584355',
         '\x00\x0f356307045490835',
         '\x00\x0f356307045568945',
         '\x00\x0f356307045415733',
         '\x00\x0f356307045606422',
         '\x00\x0f356307045425294',
         '\x00\x0f356307045469136',
         '\x00\x0f356307045568481']

cli_index=int(sys.argv[1])
eTime=client(clients[cli_index])

