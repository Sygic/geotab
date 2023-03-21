TODO:
* Truck navi: rou=tru does not change routing mode (when app is initially on car)


[TEST SYGIC TRUCK URL SCHEMA](http://com.sygic.aura//coordinate%7C17.33538055419922%7C48.141998291015625%7Cdrive&&&truckSettings%7Cwei=20000%7Caxl=5000%7Clen=10000%7Cwid=2500%7Chei=3000%7Crou=tru)


To test translations use ```globalThis.state.translate(null, "de")``` in console

You can run production version of drive addin in browser https://my1291.geotab.com/drive/default.html#main


# Test Truck URLs

[Itinerary with back button and SIF (not loading)](com.sygic.aura://routeimport|%7B%22version%22%3A%223.1%22%2C%22directives%22%3A%7B%22vehicleType%22%3A%22truck%22%2C%22routeComputeType%22%3A%22truck%22%7D%2C%22vehicleRestrictions%22%3A%7B%22weight%22%3A%2216000%22%2C%22totalLength%22%3A%2212000%22%2C%22width%22%3A%224000%22%2C%22height%22%3A%225000%22%7D%2C%22routeParts%22%3A%5B%7B%22waypointFrom%22%3A%7B%22lat%22%3A48.314870834350586%2C%22lon%22%3A18.087636947631836%2C%22type%22%3A%22via%22%7D%2C%22waypointTo%22%3A%7B%22lat%22%3A48.13605308532715%2C%22lon%22%3A18.159451484680176%2C%22type%22%3A%22via%22%7D%7D%2C%7B%22waypointFrom%22%3A%7B%22lat%22%3A48.13605308532715%2C%22lon%22%3A18.159451484680176%2C%22type%22%3A%22via%22%7D%2C%22waypointTo%22%3A%7B%22lat%22%3A48.46951866149902%2C%22lon%22%3A18.702251434326172%2C%22type%22%3A%22via%22%7D%7D%2C%7B%22waypointFrom%22%3A%7B%22lat%22%3A48.46951866149902%2C%22lon%22%3A18.702251434326172%2C%22type%22%3A%22via%22%7D%2C%22waypointTo%22%3A%7B%22lat%22%3A48.656890869140625%2C%22lon%22%3A18.49929141998291%2C%22type%22%3A%22via%22%7D%7D%2C%7B%22waypointFrom%22%3A%7B%22lat%22%3A48.656890869140625%2C%22lon%22%3A18.49929141998291%2C%22type%22%3A%22via%22%7D%2C%22waypointTo%22%3A%7B%22lat%22%3A48.22615051269531%2C%22lon%22%3A18.519328117370605%2C%22type%22%3A%22via%22%7D%7D%2C%7B%22waypointFrom%22%3A%7B%22lat%22%3A48.22615051269531%2C%22lon%22%3A18.519328117370605%2C%22type%22%3A%22via%22%7D%2C%22waypointTo%22%3A%7B%22lat%22%3A48.10638427734375%2C%22lon%22%3A18.156821250915527%2C%22type%22%3A%22finish%22%7D%7D%5D%7D|sif&&&back_button|com.geotab.androidCheckmate)

[Itinerary with back button without SIF - working](com.sygic.aura://routeimport|%7B%22version%22%3A%223.1%22%2C%22directives%22%3A%7B%22vehicleType%22%3A%22truck%22%2C%22routeComputeType%22%3A%22truck%22%7D%2C%22vehicleRestrictions%22%3A%7B%22weight%22%3A%2216000%22%2C%22totalLength%22%3A%2212000%22%2C%22width%22%3A%224000%22%2C%22height%22%3A%225000%22%7D%2C%22routeParts%22%3A%5B%7B%22waypointFrom%22%3A%7B%22lat%22%3A48.314870834350586%2C%22lon%22%3A18.087636947631836%2C%22type%22%3A%22via%22%7D%2C%22waypointTo%22%3A%7B%22lat%22%3A48.13605308532715%2C%22lon%22%3A18.159451484680176%2C%22type%22%3A%22via%22%7D%7D%2C%7B%22waypointFrom%22%3A%7B%22lat%22%3A48.13605308532715%2C%22lon%22%3A18.159451484680176%2C%22type%22%3A%22via%22%7D%2C%22waypointTo%22%3A%7B%22lat%22%3A48.46951866149902%2C%22lon%22%3A18.702251434326172%2C%22type%22%3A%22via%22%7D%7D%2C%7B%22waypointFrom%22%3A%7B%22lat%22%3A48.46951866149902%2C%22lon%22%3A18.702251434326172%2C%22type%22%3A%22via%22%7D%2C%22waypointTo%22%3A%7B%22lat%22%3A48.656890869140625%2C%22lon%22%3A18.49929141998291%2C%22type%22%3A%22via%22%7D%7D%2C%7B%22waypointFrom%22%3A%7B%22lat%22%3A48.656890869140625%2C%22lon%22%3A18.49929141998291%2C%22type%22%3A%22via%22%7D%2C%22waypointTo%22%3A%7B%22lat%22%3A48.22615051269531%2C%22lon%22%3A18.519328117370605%2C%22type%22%3A%22via%22%7D%7D%2C%7B%22waypointFrom%22%3A%7B%22lat%22%3A48.22615051269531%2C%22lon%22%3A18.519328117370605%2C%22type%22%3A%22via%22%7D%2C%22waypointTo%22%3A%7B%22lat%22%3A48.10638427734375%2C%22lon%22%3A18.156821250915527%2C%22type%22%3A%22finish%22%7D%7D%5D%7D&&&back_button|com.geotab.androidCheckmate)


# TODOS: 
Route-Plan search not respecting fromDate parameter! Have to filter out old entries manually.