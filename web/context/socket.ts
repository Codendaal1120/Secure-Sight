import { Socket, io } from 'socket.io-client';
import { DefaultEventsMap } from '@socket.io/component-emitter';
import { createContext, useEffect, useState } from 'react';

export const socket = io(process.env.NEXT_PUBLIC_API!, {  });
export const SocketContext = createContext<Socket<DefaultEventsMap, DefaultEventsMap>>(socket);