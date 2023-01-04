TODO:
* Truck navi: rou=tru does not change routing mode (when app is initially on car)


[TEST SYGIC TRUCK URL SCHEMA](http://com.sygic.aura//coordinate%7C17.33538055419922%7C48.141998291015625%7Cdrive&&&truckSettings%7Cwei=20000%7Caxl=5000%7Clen=10000%7Cwid=2500%7Chei=3000%7Crou=tru)


To test translations use ```globalThis.state.translate(null, "de")``` in console

You can run production version of drive addin in browser https://my1291.geotab.com/drive/default.html#main


# Test Truck URLs

[Itinerary](http://com.sygic.aura://routeimport|%7B%22version%22%3A%223.1%22%2C%22directives%22%3A%7B%22vehicleType%22%3A%22truck%22%2C%22routeComputeType%22%3A%22truck%22%7D%2C%22vehicleRestrictions%22%3A%7B%22weight%22%3A%2210000%22%2C%22totalLength%22%3A%2210000%22%2C%22width%22%3A%222500%22%2C%22height%22%3A%223000%22%7D%2C%22routeParts%22%3A%5B%7B%22waypointFrom%22%3A%7B%22lat%22%3A48.21876335144043%2C%22lon%22%3A17.398276329040527%2C%22type%22%3A%22via%22%7D%2C%22waypointTo%22%3A%7B%22lat%22%3A48.58326530456543%2C%22lon%22%3A18.86029624938965%2C%22type%22%3A%22via%22%7D%7D%2C%7B%22waypointFrom%22%3A%7B%22lat%22%3A48.58326530456543%2C%22lon%22%3A18.86029624938965%2C%22type%22%3A%22via%22%7D%2C%22waypointTo%22%3A%7B%22lat%22%3A48.90040397644043%2C%22lon%22%3A18.0250883102417%2C%22type%22%3A%22finish%22%7D%7D%5D%7D)

[Itinerary with back button (not loading)](http://com.sygic.aura://routeimport|%7B%22version%22%3A%223.1%22%2C%22directives%22%3A%7B%22vehicleType%22%3A%22truck%22%2C%22routeComputeType%22%3A%22truck%22%7D%2C%22vehicleRestrictions%22%3A%7B%22weight%22%3A%2210000%22%2C%22totalLength%22%3A%2210000%22%2C%22width%22%3A%222500%22%2C%22height%22%3A%223000%22%7D%2C%22routeParts%22%3A%5B%7B%22waypointFrom%22%3A%7B%22lat%22%3A48.21876335144043%2C%22lon%22%3A17.398276329040527%2C%22type%22%3A%22via%22%7D%2C%22waypointTo%22%3A%7B%22lat%22%3A48.58326530456543%2C%22lon%22%3A18.86029624938965%2C%22type%22%3A%22via%22%7D%7D%2C%7B%22waypointFrom%22%3A%7B%22lat%22%3A48.58326530456543%2C%22lon%22%3A18.86029624938965%2C%22type%22%3A%22via%22%7D%2C%22waypointTo%22%3A%7B%22lat%22%3A48.90040397644043%2C%22lon%22%3A18.0250883102417%2C%22type%22%3A%22finish%22%7D%7D%5D%7D&&&back_button|com.geotab.androidCheckmate)

[Simple navigation back to chrome (not working)](http://com.sygic.aura://coordinate|17.17130470275879|48.17758750915527|drive&&&truckSettings|wei=10000&axw=5000&len=10000&wid=2500&hei=3000&rou=tru&&&back_button|com.android.chrome)

[Simple navigation back to Geotab (not working)](http://com.sygic.aura://coordinate|17.17130470275879|48.17758750915527|drive&&&truckSettings|wei=10000&axw=5000&len=10000&wid=2500&hei=3000&rou=tru&&&back_button|com.geotab.androidCheckmate)