using Microsoft.AspNetCore.SignalR;
using Microsoft.AspNetCore.SignalR.Client;
using Microsoft.Extensions.Logging;
using System;
using System.Collections.Concurrent;
using System.Threading.Tasks;

namespace HttpProxy.Hubs
{
    public class NotificationHub : Hub
    {
        //public static ConcurrentDictionary<string, string> ConnectedUsers = new ConcurrentDictionary<string, string>();

        public static ConcurrentDictionary<(string, string), HubConnection> ConnectionsSouthBound = new();

        public NotificationHub(ILogger<NotificationHub> logger)
        {
            Logger = logger;
        }

        public ILogger<NotificationHub> Logger { get; }

        public override async Task OnConnectedAsync()
        {
            var networkId = this.Context.GetHttpContext().Request.Cookies["networkDesignId"];
            var clientId = this.Context.GetHttpContext().Request.Cookies["clientId"];
            var connectionId = this.Context.ConnectionId;
            var client = this.Clients.Client(connectionId);

            Logger.LogInformation($"OnConnectedAsync: networkDesignId, clientId from Cookies: {networkId}, {clientId}");

            if (string.IsNullOrEmpty(networkId) || string.IsNullOrEmpty(clientId))
            {
                Logger.LogInformation("OnConnectedAsync: Could not fetch networkDesignId or clientId from cookies. Overwrite from Query Params.");
                networkId = this.Context.GetHttpContext().Request.Query["networkDesignId"];
                clientId = this.Context.GetHttpContext().Request.Query["clientId"];
            }

            this.Logger.LogInformation($"OnConnectedAsync: networkId: {networkId}, clientId: {clientId}, ConnectionId: {Context.ConnectionId}");

            //if (ConnectedUsers.TryGetValue(clientId, out var oldconnectionId))
            //{
            //    await Groups.RemoveFromGroupAsync(oldconnectionId, networkId);
            //    ConnectedUsers.TryUpdate(clientId, Context.ConnectionId, oldconnectionId);
            //}
            //else
            //{
            //    ConnectedUsers.TryAdd(clientId, Context.ConnectionId);
            //}

            //await Groups.AddToGroupAsync(Context.ConnectionId, networkId); // Group name is networkId. Multiple ConnectionId(s) would be in the same group

            await base.OnConnectedAsync();

            // At this point, we as proxy have received a new connection. So we must make a connection to the actual WebsocketService

            var url = $"http://localhost:44365/WebSocketsService/chats?networkDesignId={networkId}&clientId={clientId}";

            var connection = new HubConnectionBuilder()
                .WithUrl(url)
                .Build();

            if (ConnectionsSouthBound.TryGetValue((networkId, clientId), out HubConnection hubConnection))
            {
                ConnectionsSouthBound.TryUpdate((networkId, clientId), connection, hubConnection);
            }
            else
            {
                ConnectionsSouthBound.TryAdd((networkId, clientId), connection);
            }

            connection.On<string, object>("ReceiveMessage", async (payloadType, eventArg2) => 
            {
                Logger.LogInformation($"ReceiveMessage: {payloadType}, {networkId}, {clientId}, {eventArg2}");

                //await this.Clients.Client(connectionId).SendAsync("ReceiveMessage", payloadType, eventArg2);
                await client.SendAsync("ReceiveMessage", payloadType, eventArg2);
            });

            await connection.StartAsync();
        }



        public override async Task OnDisconnectedAsync(Exception exception)
        {
            var clientId = this.Context.GetHttpContext().Request.Query["clientId"];

            var networkDesignId = this.Context.GetHttpContext().Request.Query["networkDesignId"];

            this.Logger.LogInformation($"OnDisconnectedAsync: networkDesignId: {networkDesignId}, clientId: {clientId}, ConnectionId: {Context.ConnectionId}");

            string oldconnectionId = string.Empty;

            //if (!string.IsNullOrEmpty(clientId) && ConnectedUsers.TryGetValue(clientId, out oldconnectionId))
            //{
            //    ConnectedUsers.TryRemove(clientId, out _);
            //}

            //if (!string.IsNullOrEmpty(oldconnectionId))
            //{
            //    await Groups.RemoveFromGroupAsync(oldconnectionId, networkDesignId);
            //}

            if (!string.IsNullOrEmpty(clientId) && !string.IsNullOrEmpty(networkDesignId))
            {
                if (ConnectionsSouthBound.TryGetValue((networkDesignId, clientId), out HubConnection hubConnection))
                {
                    ConnectionsSouthBound.TryRemove((networkDesignId, clientId), out _);
                }

                await hubConnection.DisposeAsync();
            }

            await base.OnDisconnectedAsync(exception);
        }

    }
}
