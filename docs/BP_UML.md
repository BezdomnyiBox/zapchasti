@startuml
title Суетлогия - бизнец процесса

|Client|
start
:Найти запчасть в каталоге Drom?;

if (Есть ссылка?) then (Да)

  :Создать заявку;

  if (Уже оплатил продавцу?) then (Да)
    |System|
    :Создать PickupTask (без проверки);
  else (Нет)
    |System|
    :Создать PickupTask (с доп. проверкой);
  endif

else (Нет ссылки)
  |Client|
  :Создать заявку на подбор;
  |System|
  :Создать SelectionTask;
  |Courier|
  :Связаться с клиентом;
  :Подобрать деталь;
  :Согласовать цену;
  |System|
  :Создать PickupTask;
endif


|Courier|
:Получить PickupTask;
:Приехать к продавцу;

if (Нужна проверка?) then (Да)
  :Осмотреть деталь;
  :Сделать фото;
  |System|
  :Отправить фото клиенту;
  |Client|
  :Подтвердить покупку;
  |System|
  :Оплатить продавцу;
endif

:Забрать деталь;

|Client|
:Выбрать способ доставки;

if (Свои перевозчики?) then (Да)
  |System|
  :Создать HandoverTask;
  |Courier|
  :Передать стороннему перевозчику;
else (Наша доставка)
  |System|
  :Создать DeliveryTask;
  |Courier|
  :Доставить клиенту;
endif

|Client|
:Подтвердить получение;

|System|
:Закрыть заказ;

stop
@enduml