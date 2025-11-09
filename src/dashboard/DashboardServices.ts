import IStorage from "app/lib/IStorage.js";
import ComponentMessagingService from "app/dashboard/ComponentMessagingService.js";
import ReadCache from "app/lib/ReadCache.js";

export default interface DashboardServices
{
    readonly storage: IStorage;
    readonly messaging: ComponentMessagingService;
    readonly cache: {
        /**
         * Cache that is scoped to component instance and is not shared with other components.
         */
        readonly instance: ReadCache;
        
        /**
         * Cache that is shared between instances of the same component kind.
         */
        readonly component: ReadCache;
    };
}