import mysql.connector as mysql

class MySQL:

    def __init__(self, host, user, password=""):

        self.host = host
        self.user = user
        self.password = password

        self.__connection = None
        self.__cursor = None

    def __enter__(self):
        """
            Open a connection to a mysql
        """

        self.__connection = mysql.connect( host="192.168.43.226", user="ca-web", password="" )
        self.__cursor = self.__connection.cursor( buffered=True )

        return self

    def __exit__(self, exc_type, exc_val, exc_tb):
        try:
            self.__cursor.close()
            self.__connection.close()
        except Exception as e:
            print( e )

    def use_db(self, db_name):
        self.execute("USE cadata", fetch=False )

    def execute(self, query, fetch=True):
        """
            Executes a query on the data and fetches the data if required
        :param query: mysql query
        :param fetch: should the data be fetched
        :return: if fetch: the data returned by the query. Otherwise returns None
        """

        self.__cursor.execute( query )

        if fetch:
            return self.__cursor.fetchall()

        return None

