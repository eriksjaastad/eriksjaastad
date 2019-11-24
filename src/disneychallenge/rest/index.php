<html>
 <body>

<?php
if (isset($_GET["action"]) && isset($_GET["id"]) && $_GET["action"] == "get_app") 
{
  $app_info = file_get_contents('http://eriksjaastad.com/disneychallenge/rest/api.php?action=get_app&id=' . $_GET["id"]);
  $app_info = json_decode($app_info, true);
  ?>
    <table>
      <tr>
        <td>App Name: </td><td> <?php echo $app_info["app_name"] ?></td>
      </tr>
      <tr>
        <td>Price: </td><td> <?php echo $app_info["app_price"] ?></td>
      </tr>
      <tr>
        <td>Version: </td><td> <?php echo $app_info["app_version"] ?></td>
      </tr>
    </table>
    <br />
    <a href="http://eriksjaastad.com/disneychallenge/rest/home/" alt="app list">Return to the app list</a>
  <?php
}
else // else take the app list
{
  $app_list = file_get_contents('http://eriksjaastad.com/disneychallenge/rest/api.php?action=get_app_list');
  $app_list = json_decode($app_list, true);
  ?>
    <ul>
    <?php foreach ($app_list as $app): ?>
      <li>
        <a href=<?php echo "http://eriksjaastad.com/disneychallenge/rest/shuffle/" . $app["id"]  ?> alt=<?php echo "app_" . $app_["id"] ?>><?php echo $app["name"] ?></a>
    </li>
    <?php endforeach; ?>
    </ul>
  <?php
} ?>
 </body>
</html>
